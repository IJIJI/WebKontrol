import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RetryHandler } from "./src/puppet/pacing";
import { killProcessTree } from "./src/helpers/processTree";
import { Logger } from "./src/logging/Logger";

// Keeps the app running: restart on any exit we did not ask for, on the shared backoff
// curve so a permanently broken app settles at the cap instead of looping hot. Runs in
// every deployment; systemd/Docker restart policies watch THIS process, so the two layers
// supervise different things and cannot fight.
//
// Production-only by design: it always runs the built app beside itself (no tsx, no
// NODE_ENV branch), and `yarn dev` runs app.ts directly so a dev crash stays visible
// instead of being restarted under you.
//
// An update later needs nothing from this file: the app applies it and exits, and the
// restart comes back on the new code.

// Same cwd as the app, so both write ONE logs/webkontrol.log: a crash and the
// supervisor's reaction to it read as one timeline in a post-mortem.
// ponytail: the Logger's size rotation is not multi-process safe; if both processes cross
// the 10MB boundary in the same instant, one rotated generation can be lost. Rare and it
// only costs old lines; give the Logger a lock/owner if it ever bites.
const logger = new Logger(["SUPERVISOR"]);

const APP_ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "app.js");

// A display should come back within a minute of a fault clearing; heavier than a page
// load, lighter than five-minute Chromium relaunch territory.
const retry = new RetryHandler({ baseMs: 1_000, capMs: 60_000 });
// A run that lasted this long was healthy: its eventual death starts a fresh curve
// instead of inheriting escalation from trouble long since resolved.
const HEALTHY_MS = 60_000;
// Our close walks every puppet and closes a browser each; forcing at Beacon's 5s would
// kill mid-walk and orphan exactly what the graceful path exists to prevent.
const GRACE_MS = 25_000;

let child: ChildProcess | null = null;
let shuttingDown = false;

function start(): void {
  const spawnedAt = Date.now();
  // The ipc channel is the stop path: Windows has no signals to forward, and on POSIX a
  // second signal would trip the app's force-on-repeat guard (see app.ts).
  const proc = spawn(process.execPath, [APP_ENTRY], {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  child = proc;
  // IMPORTANT, like the app's "Admin server running": under systemd/Docker the console is
  // the journal, and "the service came up" belongs in it.
  logger.important(`Started app (pid ${proc.pid}).`);

  // exit and error can both fire for one child (a failed spawn errors, then exits).
  let settled = false;
  const onDown = (what: string): void => {
    if (settled) return;
    settled = true;
    child = null;
    if (shuttingDown) return; // the shutdown path owns this exit
    if (Date.now() - spawnedAt > HEALTHY_MS) retry.reset();
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
