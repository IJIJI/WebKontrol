import { spawn, type ChildProcess } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RetryHandler } from "./src/puppet/pacing";
import { killProcessTree } from "./src/helpers/processTree";
import { Logger } from "./src/logging/Logger";
import type { PendingUpdate } from "./src/system/update/UpdateRunner";

// Keeps the app running: restart on any exit we did not ask for, on the shared backoff
// curve so a permanently broken app settles at the cap instead of looping hot. Runs in
// every deployment; systemd/Docker restart policies watch THIS process, so the two layers
// supervise different things and cannot fight.
//
// Production-only by design: it always runs built code (no tsx, no NODE_ENV branch), and
// `yarn dev` runs app.ts directly so a dev crash stays visible instead of being restarted
// under you.
//
// Updates: the app builds the new release, flips the `current` pointer and exits; the
// restart comes back on the new code. This file is the safety net's other half: while
// releases/pending.json exists the new version is unproven, so surviving the healthy
// window confirms it, and crash-looping inside that window rolls pointer AND database
// back to what pending.json records. The contract is deliberately this small so an old
// supervisor keeps working with any newer release.

// Same cwd as the app, so both write ONE logs/webkontrol.log: a crash and the
// supervisor's reaction to it read as one timeline in a post-mortem.
// ponytail: the Logger's size rotation is not multi-process safe; if both processes cross
// the 10MB boundary in the same instant, one rotated generation can be lost. Rare and it
// only costs old lines; give the Logger a lock/owner if it ever bites.
const logger = new Logger(["SUPERVISOR"]);

const ROOT = process.cwd();
const POINTER = path.join(ROOT, "current");
const PENDING = path.join(ROOT, "releases", "pending.json");
const LIVE_DB = path.join(ROOT, "db", "database.db"); // CoreDatabase's fixed location

// Managed layout: the pointer names the active release dir, re-read on every start so a
// restart lands on freshly flipped pointers. Without one (a plain dist run) the app
// sits beside this file, which is the pre-update-manager behaviour unchanged.
function resolveEntry(): string {
  if (!existsSync(POINTER))
    return path.join(path.dirname(fileURLToPath(import.meta.url)), "app.js");
  const version = readFileSync(POINTER, "utf8").trim();
  return path.join(ROOT, "releases", version, "dist", "app.js");
}

// A display should come back within a minute of a fault clearing; heavier than a page
// load, lighter than five-minute Chromium relaunch territory.
const retry = new RetryHandler({ baseMs: 1_000, capMs: 60_000 });
// A run that lasted this long was healthy: its eventual death starts a fresh curve
// instead of inheriting escalation from trouble long since resolved.
const HEALTHY_MS = 60_000;
// Our close walks every puppet and closes a browser each; forcing at Beacon's 5s would
// kill mid-walk and orphan exactly what the graceful path exists to prevent.
const GRACE_MS = 25_000;

// An unproven release (pending.json still present) gets this many rapid failures before
// the supervisor concludes the update itself is broken and rolls back.
const ROLLBACK_AFTER_CRASHES = 3;

let child: ChildProcess | null = null;
let shuttingDown = false;
let rapidCrashes = 0;

// The other end of the runner's write-pending step: put pointer and database back the
// way pending.json recorded them. The WAL/SHM sidecars beside the live db belong to the
// abandoned state and would be replayed over the restored file, so they go first.
// Best-effort by contract: if this fails, restarts continue on the broken release at the
// backoff cap, loudly, which still beats guessing.
function rollBack(): void {
  try {
    const pending = JSON.parse(readFileSync(PENDING, "utf8")) as PendingUpdate;
    logger.error(`Update to ${pending.to} is crash-looping; rolling back to ${pending.from}.`);
    writeFileSync(`${POINTER}.tmp`, pending.from);
    renameSync(`${POINTER}.tmp`, POINTER);
    rmSync(`${LIVE_DB}-wal`, { force: true });
    rmSync(`${LIVE_DB}-shm`, { force: true });
    copyFileSync(pending.dbBackup, LIVE_DB);
    rmSync(PENDING, { force: true });
    logger.error(`Rolled back to ${pending.from}; database restored from the snapshot.`);
  } catch (error) {
    logger.error(`Rollback failed; continuing restarts on the current release:`, error);
  }
}

function start(): void {
  const spawnedAt = Date.now();
  // The ipc channel is the stop path: Windows has no signals to forward, and on POSIX a
  // second signal would trip the app's force-on-repeat guard (see app.ts).
  const proc = spawn(process.execPath, [resolveEntry()], {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  child = proc;
  // IMPORTANT, like the app's "Admin server running": under systemd/Docker the console is
  // the journal, and "the service came up" belongs in it.
  logger.important(`Started app (pid ${proc.pid}).`);

  // Surviving the healthy window proves a pending update: deleting the marker closes the
  // rollback window, and from here on a crash is the app's problem, not the update's.
  const confirm = setTimeout(() => {
    if (!existsSync(PENDING)) return;
    rmSync(PENDING, { force: true });
    logger.important("Update survived the healthy window; rollback window closed.");
  }, HEALTHY_MS);
  confirm.unref();

  // exit and error can both fire for one child (a failed spawn errors, then exits).
  let settled = false;
  const onDown = (what: string): void => {
    if (settled) return;
    settled = true;
    child = null;
    clearTimeout(confirm);
    if (shuttingDown) return; // the shutdown path owns this exit
    const healthy = Date.now() - spawnedAt > HEALTHY_MS;
    if (healthy) retry.reset();
    rapidCrashes = healthy ? 0 : rapidCrashes + 1;
    if (!healthy && rapidCrashes >= ROLLBACK_AFTER_CRASHES && existsSync(PENDING)) {
      rollBack();
      retry.reset(); // whatever runs next, it starts on a fresh curve
      rapidCrashes = 0;
    }
    const delay = retry.schedule(start);
    logger.warn(`App ${what}; restarting in ${delay}ms.`);
  };
  proc.on("exit", (code, signal) => onDown(`exited (code=${code}, signal=${signal})`));
  proc.on("error", (error) => onDown(`failed to start (${String(error)})`));
}

function shutdown(origin: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  retry.cancel();

  const proc = child;
  logger.important(`${origin}: shutting down.`);
  if (!proc) process.exit(0);

  try {
    proc.send?.("shutdown"); // idempotent on the app side; harmless beside a group signal
  } catch {
    // channel already closed; the exit listener below still resolves the shutdown
  }
  const force = setTimeout(() => {
    logger.warn(`App ignored the stop for ${GRACE_MS}ms; killing its tree.`);
    killProcessTree(proc);
    setTimeout(() => process.exit(1), 2_000).unref(); // even the kill failing must not hang the stop
  }, GRACE_MS);
  force.unref();

  proc.once("exit", () => {
    clearTimeout(force);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
// The launcher's (and any test's) graceful stop: signals do not exist on Windows, so a
// parent that spawned us with an ipc channel asks the same way we ask the app.
if (process.send) {
  process.on("message", (message) => {
    if (message === "shutdown") shutdown("stop request");
  });
}

start();
