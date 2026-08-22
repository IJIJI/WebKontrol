/**
 * End-to-end test of the update system against a LOCAL fake GitHub: a scratch managed
 * layout (built by the real installer) runs the real built app under the real supervisor,
 * and the scenarios run in sequence against real HTTP, real tarballs and the real disk.
 *
 * The fake GitHub publishes seven versions, each there to prove one thing:
 *   v0.0.1    below the floor: filtered out, never listed
 *   v9.9.7    below a fake migration at 9.9.8: a downgrade to it is gated
 *   v9.9.8    the base install
 *   v9.9.9    GitHub's LATEST: the one and only announced update
 *   v9.9.10   flagged pre-release AND broken: quiet mention, installable, then rolls back
 *   v9.9.11   stable but NOT marked latest (held back): listed, never announced
 *   v9.9.12   no tarball yet (CI still building): filtered out, never listed
 *
 *   0. What the fresh install sees: exactly the five installable releases, v9.9.9 announced
 *      as READY, the gated downgrade and the flagged pre-release marked as such.
 *   A. Clean update, v9.9.8 to v9.9.9 (the real build): download, focus install, swap,
 *      restart, pending cleared by the supervisor, journal confirmed "ok"; then on latest
 *      nothing is announced even though v9.9.11 is newer.
 *   B. Lossless downgrade, v9.9.9 to v9.9.8: fast path (release still on disk), swap back.
 *   B2. Downgrade to v9.9.7 crosses the fake migration: refused by name (409).
 *   C. Broken update, v9.9.8 to v9.9.10 (an app that throws on boot): three rapid
 *      crashes, supervisor rolls pointer and database back, journal says "rolled-back".
 *
 * Run with `yarn e2e:update` (add --no-build to reuse the existing dist). Takes a few
 * minutes: the healthy/confirmation windows (60s/90s) are real, not mocked. Not part of
 * `yarn check` on purpose. The scratch root is kept on failure for forensics.
 *
 * `--hold` skips the scenarios and leaves everything running instead: the same managed
 * root with the same fake releases, for clicking through the Updates UI by hand
 * (Check, Update, Downgrade, and the broken release to watch a live rollback).
 * Ctrl+C tears it down.
 */
import assert from "node:assert/strict";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import { killProcessTree } from "../src/helpers/processTree";

const APP_DIR = path.join(import.meta.dirname, "..");

// Preferred ports, so the admin URL is usually the same one twice in a row. A leftover
// run (or anything else on the port) must not fail the whole harness though, so a busy
// port falls back to whatever the OS hands out, and the real URL is printed either way.
async function pickPort(preferred: number): Promise<number> {
  const free = await new Promise<boolean>((resolve) => {
    const probe = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => probe.close(() => resolve(true)))
      .listen(preferred);
  });
  if (free) return preferred;
  return new Promise((resolve) => {
    const probe = net.createServer().listen(0, () => {
      const { port } = probe.address() as net.AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

const GH_PORT = await pickPort(8098);
const WEB_PORT = await pickPort(8099);
const REAL_TAG = "v9.9.9"; // GitHub's latest
const BROKEN_TAG = "v9.9.10"; // flagged pre-release, crashes on boot
const HELD_TAG = "v9.9.11"; // stable, newer than latest, deliberately not marked latest
const BUILDING_TAG = "v9.9.12"; // published without its tarball yet
const FLOORED_TAG = "v0.0.1"; // predates the update system
// All tags sit above the source's floor version; a below-floor base tag gets filtered
// out of the allowlist and every downgrade to it correctly refused (learned live).
const BASE_TAG = "v9.9.8";
// Sits below a (config-injected, gate-only) fake migration in BASE_TAG, so a downgrade
// to it is lossy: the disabled button, the tooltip, and the 409 all become visible in
// hold mode without a real schema change existing anywhere.
const ANCIENT_TAG = "v9.9.7";

const log = (line: string): void => console.log(`\x1b[36m[E2E]\x1b[0m ${line}`);

// ---------- helpers ----------

async function waitFor(
  what: string,
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return log(`ok: ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for: ${what}`);
}

async function appUp(): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${WEB_PORT}/`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function post(route: string, body?: unknown): Promise<Response> {
  return fetch(`http://127.0.0.1:${WEB_PORT}/api${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// ---------- build + tarballs ----------

if (!process.argv.includes("--no-build")) {
  log("Building (yarn build)...");
  execFileSync("yarn", ["build"], { cwd: APP_DIR, stdio: "inherit", shell: process.platform === "win32" });
}
assert.ok(existsSync(path.join(APP_DIR, "dist", "app.js")), "dist/app.js exists");

const root = mkdtempSync(path.join(os.tmpdir(), "wk-update-e2e-"));
log(`Scratch root: ${root}`);
const assets = path.join(root, "gh-assets");
mkdirSync(assets, { recursive: true });

// The real tarball: exactly what the CI workflow packs. tar gets relative paths only
// (cwd = destination, -C = source): GNU tar reads absolute "C:\..." as a remote host.
const pack = (name: string, sourceDir: string): void =>
  void execFileSync("tar", ["-czf", name, "-C", sourceDir, "dist", "package.json", "yarn.lock", ".yarnrc.yml"], { cwd: assets });
pack(`webkontrol-${REAL_TAG}.tar.gz`, APP_DIR);
// The base release is downloadable too, not just present on disk: retention keeps only
// the current and previous release, so after two updates a downgrade to it has to fetch
// the tarball like any other. Advertising a release without serving it produced a 404.
pack(`webkontrol-${BASE_TAG}.tar.gz`, APP_DIR);
pack(`webkontrol-${ANCIENT_TAG}.tar.gz`, APP_DIR);
pack(`webkontrol-${HELD_TAG}.tar.gz`, APP_DIR);

// The broken release: installs fine (no deps), throws on boot.
const brokenSrc = path.join(root, "broken-src");
mkdirSync(path.join(brokenSrc, "dist"), { recursive: true });
writeFileSync(path.join(brokenSrc, "dist", "app.js"), `throw new Error("broken release (e2e)");`);
writeFileSync(path.join(brokenSrc, "package.json"), JSON.stringify({ name: "broken", version: "9.9.10", packageManager: "yarn@4.9.2" }));
writeFileSync(path.join(brokenSrc, "yarn.lock"), "");
writeFileSync(path.join(brokenSrc, ".yarnrc.yml"), "nodeLinker: node-modules\nenableTelemetry: false\n");
pack(`webkontrol-${BROKEN_TAG}.tar.gz`, brokenSrc);

// ---------- the fake GitHub ----------

// Exercises the notes renderer as well as the update itself: headings, lists, code,
// tables, task lists, links and two GitHub alert kinds.
const notes = (tag: string): string => `## What's new in ${tag}

Updated the **display pipeline** and the \`UpdateRunner\`.

> [!NOTE]
> This is an end-to-end test release, served by a fake GitHub.

- A list item with \`inline code\`
- A [link to somewhere](https://example.test/release)
- [x] A finished task

| Component | Change |
| --- | --- |
| Runner | extracts with relative paths |
| Supervisor | rolls back on repeated crashes |

> [!WARNING]
> Downgrading past a database change is refused by the gate.
`;

// The broken release is flagged pre-release: exactly how a test build would be
// published, and it keeps GitHub's "latest" on the real update rather than on it.
const ghRelease = (tag: string): object => ({
  tag_name: tag,
  name: `Release ${tag}`,
  published_at: "2026-08-19T00:00:00Z",
  prerelease: tag === BROKEN_TAG,
  body: notes(tag),
  assets:
    tag === BUILDING_TAG
      ? [] // CI has not attached the tarball yet
      : [
          {
            name: `webkontrol-${tag}.tar.gz`,
            browser_download_url: `http://127.0.0.1:${GH_PORT}/assets/webkontrol-${tag}.tar.gz`,
          },
        ],
});
const ALL_TAGS = [BUILDING_TAG, HELD_TAG, BROKEN_TAG, REAL_TAG, BASE_TAG, ANCIENT_TAG, FLOORED_TAG];

const gh = http.createServer((req, res) => {
  // GitHub's own "latest": the newest stable, which is what the app announces and what
  // the installer installs by default.
  if (req.url === "/repos/ijiji/WebKontrol/releases/latest") {
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(ghRelease(REAL_TAG)));
  }
  // The installer asks for one release by tag; the app asks for the whole list.
  const tagMatch = /^\/repos\/ijiji\/WebKontrol\/releases\/tags\/([^/?]+)$/.exec(req.url ?? "");
  if (tagMatch) {
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(ghRelease(decodeURIComponent(tagMatch[1]))));
  }
  if (req.url === "/repos/ijiji/WebKontrol/releases") {
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(ALL_TAGS.map(ghRelease)));
  }
  if (req.url?.startsWith("/assets/")) {
    const file = path.join(assets, path.basename(req.url));
    if (existsSync(file)) return void createReadStream(file).pipe(res);
  }
  res.statusCode = 404;
  res.end("not found");
});
gh.listen(GH_PORT);
log(`Fake GitHub on :${GH_PORT}${GH_PORT === 8098 ? "" : " (8098 was busy)"}`);

// ---------- the managed layout, built by the REAL installer ----------
// The harness used to assemble this by hand; running install.mjs instead means every
// e2e run also proves the installer against the same fake GitHub. The config is written
// first: the installer only writes its starter when none exists, and this root needs
// the harness port, the api_base seam and the gate-only fake migration.
mkdirSync(path.join(root, "config"), { recursive: true });
writeFileSync(
  path.join(root, "config", "config.yaml"),
  // The fake migration at 9.9.8 is GATE-ONLY (see the config schema): it makes the
  // downgrade to ANCIENT_TAG lossy so the disabled state and the 409 are visible.
  `puppets: []
web:
  port: ${WEB_PORT}
update:
  api_base: http://127.0.0.1:${GH_PORT}
  fake_migration_versions: ["9.9.8"]
`,
);
log(`Installing ${BASE_TAG} with the real installer...`);
// Async on purpose: the fake GitHub lives in THIS process, so a spawnSync here blocks
// the event loop and deadlocks the installer against a server that can never answer.
const installerExit = await new Promise<number | null>((resolve, reject) => {
  const child = spawn(
    process.execPath,
    [path.join(APP_DIR, "..", "install.mjs"), root, "--version", BASE_TAG, "--api-base", `http://127.0.0.1:${GH_PORT}`],
    { stdio: "inherit", env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: "true" } },
  );
  child.once("exit", resolve);
  child.once("error", reject);
});
if (installerExit !== 0) throw new Error("install.mjs failed; the output above says why.");


// ---------- probes ----------

// The update section of the state, exactly as the admin UI receives it: the first data
// event on the SSE stream, which the server writes on connect.
interface UpdateSection {
  current: string;
  activity: { state: string; latest?: { version: string } };
  releases: { version: string; prerelease: boolean; crossings?: string[] }[];
}
async function readUpdateState(): Promise<UpdateSection> {
  const controller = new AbortController();
  const response = await fetch(`http://127.0.0.1:${WEB_PORT}/api/state`, { signal: controller.signal });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const match = /event: data\ndata: (.*)\n\n/.exec(buffer);
      if (match) return (JSON.parse(match[1]) as { info: { update: UpdateSection } }).info.update;
    }
  } finally {
    controller.abort();
  }
  throw new Error("No state event arrived on /api/state");
}

const pointer = (): string => readFileSync(path.join(root, "current"), "utf8").trim();
const pendingExists = (): boolean => existsSync(path.join(root, "releases", "pending.json"));

// The journal, read straight from the scratch database (same row the UpdateStore reads).
async function journalStatus(): Promise<string | null> {
  const { default: Database } = await import("better-sqlite3");
  try {
    const db = new Database(path.join(root, "db", "database.db"), { readonly: true, fileMustExist: true });
    try {
      const row = db
        .prepare("SELECT value FROM settings WHERE domain='app' AND type='update' AND key='journal'")
        .get() as { value: string } | undefined;
      return row === undefined ? null : (JSON.parse(row.value) as { status: string }).status;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

// ---------- scenarios ----------

let supervisor: ChildProcess | null = null;

async function main(): Promise<void> {
  supervisor = spawn(process.execPath, [path.join(root, "supervisor.js")], {
    cwd: root,
    stdio: ["inherit", "inherit", "inherit", "ipc"],
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: "true" }, // installs need no browser here
  });
  await waitFor("base app serving", appUp, 60_000);
  assert.equal(pointer(), BASE_TAG);

  if (process.argv.includes("--hold")) {
    log(`HOLD MODE: a managed ${BASE_TAG} system is running.`);
    log(`  Admin:        http://127.0.0.1:${WEB_PORT}/settings`);
    log(`  Releases:     ${REAL_TAG} (latest: the announced update), ${HELD_TAG} (newer but held back),`);
    log(`                ${BROKEN_TAG} (pre-release, crashes -> live rollback),`);
    log(`                ${ANCIENT_TAG} (downgrade gated by a fake migration at 9.9.8)`);
    log(`  Scratch root: ${root}`);
    log(`  Ctrl+C stops the supervisor and cleans up.`);
    process.on("SIGINT", () => {
      void stop().then(() => {
        rmSync(root, { recursive: true, force: true });
        process.exit(0);
      });
    });
    return new Promise(() => {}); // parked until Ctrl+C
  }

  log("Scenario 0: what the fresh install sees...");
  await waitFor("boot check landed", async () => (await readUpdateState()).releases.length > 0, 30_000);
  {
    const state = await readUpdateState();
    assert.deepEqual(
      state.releases.map((release) => release.version),
      [HELD_TAG, BROKEN_TAG, REAL_TAG, BASE_TAG, ANCIENT_TAG],
      "newest first; the floored and the tarball-less releases are not listed",
    );
    assert.equal(state.activity.state, "Ready", "an update is announced");
    assert.equal(state.activity.latest?.version, REAL_TAG, "the announced one is GitHub's latest, not the newest");
    assert.equal(state.releases.find((release) => release.version === BROKEN_TAG)?.prerelease, true);
    assert.deepEqual(
      state.releases.find((release) => release.version === ANCIENT_TAG)?.crossings,
      ["9.9.8"],
      "the gated downgrade carries what it would lose",
    );
    log("ok: list, announcement, flags and crossings as designed");
  }

  log(`Scenario A: apply ${REAL_TAG} (real tarball, real install)...`);
  assert.equal((await post("/update/check")).status, 204, "check returns 204");
  assert.equal((await post("/update/apply", { version: REAL_TAG })).status, 204, "apply accepted");
  await waitFor(`pointer flips to ${REAL_TAG}`, () => pointer() === REAL_TAG, 8 * 60_000);
  assert.equal(pendingExists(), true, "pending.json exists right after the swap");
  await waitFor("updated app serving", appUp, 60_000);
  assert.ok(existsSync(path.join(root, "releases", BASE_TAG)), "previous release retained");
  await waitFor("supervisor clears pending (healthy window)", () => !pendingExists(), 100_000);
  await waitFor("journal confirmed ok", async () => (await journalStatus()) === "ok", 120_000);
  {
    const state = await readUpdateState();
    assert.equal(state.current, REAL_TAG);
    assert.equal(state.activity.state, "Idle", "on latest nothing is announced, although a newer stable exists");
    const quiet = state.releases.find((release) => release.prerelease && release.version !== state.current);
    assert.equal(quiet?.version, BROKEN_TAG, "the flagged release is there for the quiet mention");
    log("ok: latest beats newest; the pre-release is only mentioned");
  }

  log(`Scenario B: lossless downgrade to ${BASE_TAG} (already on disk)...`);
  assert.equal((await post("/update/apply", { version: BASE_TAG })).status, 204, "downgrade accepted");
  await waitFor(`pointer flips back to ${BASE_TAG}`, () => pointer() === BASE_TAG, 60_000);
  await waitFor("downgraded app serving", appUp, 60_000);
  assert.ok(existsSync(path.join(root, "releases", REAL_TAG)), "the release we left is retained");
  await waitFor("pending cleared again", () => !pendingExists(), 100_000);

  log(`Scenario B2: downgrade to ${ANCIENT_TAG} crosses the fake migration, expect refusal...`);
  {
    const response = await post("/update/apply", { version: ANCIENT_TAG });
    assert.equal(response.status, 409, "a lossy downgrade answers 409");
    const body = (await response.json()) as { error?: string };
    assert.match(String(body.error), /database changes of 9\.9\.8/, "the refusal names the migration");
    log("ok: lossy downgrade refused by name");
  }

  log(`Scenario C: apply the broken ${BROKEN_TAG}, expect rollback...`);
  assert.equal((await post("/update/apply", { version: BROKEN_TAG })).status, 204, "apply accepted");
  await waitFor(`pointer flips to ${BROKEN_TAG}`, () => pointer() === BROKEN_TAG, 4 * 60_000);
  await waitFor(`rollback flips pointer back to ${BASE_TAG}`, () => pointer() === BASE_TAG, 90_000);
  await waitFor("rolled-back app serving", appUp, 60_000);
  assert.equal(pendingExists(), false, "rollback cleared pending");
  await waitFor("journal says rolled-back", async () => (await journalStatus()) === "rolled-back", 60_000);

  log("ALL SCENARIOS PASSED");
}

function stop(): Promise<void> {
  return new Promise((resolve) => {
    if (!supervisor) return resolve();
    supervisor.once("exit", () => resolve());
    try {
      supervisor.send("shutdown");
    } catch {
      resolve();
    }
  });
}

// Being killed outright (a stopped task, a closed terminal) skips the graceful stop above,
// and on Windows the supervisor then survives its parent and keeps the ports. Take the
// tree down synchronously on the way out; a leaked one blocks the next run.
process.on("exit", () => void killProcessTree(supervisor));

try {
  await main();
  await stop();
  gh.close();
  rmSync(root, { recursive: true, force: true });
  process.exit(0);
} catch (error) {
  console.error(error);
  console.error(`Scratch root kept for forensics: ${root}`);
  await stop();
  gh.close();
  process.exit(1);
}
