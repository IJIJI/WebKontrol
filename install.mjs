#!/usr/bin/env node
/**
 * WebKontrol installer: creates a managed layout in an empty directory, which is
 * deliberately the same thing an update produces (see app/src/system/update/UpdateRunner.ts
 * for the layout contract). After this, the system updates itself from the admin UI, and
 * its very first update can already roll back.
 *
 *   curl -fsSL https://raw.githubusercontent.com/ijiji/WebKontrol/main/install.mjs -o install.mjs
 *   node install.mjs <target-dir> [--version vX.Y.Z] [--api-base <url>]
 *
 * Layout-only on purpose: it verifies prerequisites (node, yarn via corepack, tar) but
 * never installs them, and it prints a systemd unit rather than writing one. Boot
 * survival belongs to the deployment vehicle (the Pi image, Docker's restart policy, or
 * the Windows launcher), not to this script.
 *
 * Standalone by design: fetched raw from the repo, it can import nothing from the app.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, copyFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const REPO = "ijiji/WebKontrol";
const MIN_NODE_MAJOR = 22;

// ---------- arguments ----------

const args = process.argv.slice(2);
const flags = new Map();
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) flags.set(args[i], args[++i]);
  else positional.push(args[i]);
}
const root = positional[0];
const wantedVersion = flags.get("--version");
const apiBase = flags.get("--api-base") ?? "https://api.github.com";

if (!root) {
  console.error("Usage: node install.mjs <target-dir> [--version vX.Y.Z] [--api-base <url>]");
  process.exit(1);
}

const fail = (message) => {
  console.error(`\n[install] ${message}`);
  process.exit(1);
};
const log = (message) => console.log(`[install] ${message}`);

// ---------- prerequisites: verified, never installed ----------

const major = Number(process.version.slice(1).split(".")[0]);
if (major < MIN_NODE_MAJOR) fail(`Node ${MIN_NODE_MAJOR}+ is required (this is ${process.version}).`);

const tool = (command, hint) => {
  const result = spawnSync(command, ["--version"], {
    shell: process.platform === "win32",
    stdio: "ignore",
  });
  if (result.status !== 0) fail(`\`${command}\` is not available. ${hint}`);
};
tool("tar", "It ships with Windows 10+ and every Linux; install it via your package manager.");
tool("yarn", "Run `corepack enable` (corepack ships with Node) to make yarn available.");

// ---------- refuse to install over an installation ----------

if (existsSync(join(root, "current")))
  fail(`${root} already holds a managed installation; updates happen in the admin UI.`);

// ---------- pick the release ----------

const ghHeaders = { "User-Agent": "WebKontrol-installer", Accept: "application/vnd.github+json" };
const releaseUrl = wantedVersion
  ? `${apiBase}/repos/${REPO}/releases/tags/${encodeURIComponent(wantedVersion)}`
  : `${apiBase}/repos/${REPO}/releases/latest`; // GitHub's "latest" = newest stable

log(wantedVersion ? `Fetching release ${wantedVersion}...` : "Fetching the latest stable release...");
const releaseResponse = await fetch(releaseUrl, { headers: ghHeaders });
if (releaseResponse.status === 404 && !wantedVersion)
  fail(
    "No stable release exists yet: releases marked pre-release are never installed by default. " +
      "Pass --version <tag> to install one deliberately.",
  );
if (!releaseResponse.ok)
  fail(`Could not fetch the release (${releaseResponse.status}). Wrong --version, or GitHub is unreachable.`);
const release = await releaseResponse.json();
const tag = release.tag_name;
const tarball = (release.assets ?? []).find((asset) => asset.name?.endsWith(".tar.gz"));
if (!tag || !tarball) fail(`Release ${tag ?? "?"} carries no update tarball; it cannot be installed.`);

// ---------- build the layout, the same order an update uses ----------

const staging = join(root, "releases", ".staging");
rmSync(staging, { recursive: true, force: true });
mkdirSync(join(staging, "release"), { recursive: true });
for (const dir of ["config", "db", "logs", "puppeteer"]) mkdirSync(join(root, dir), { recursive: true });

log(`Downloading ${tarball.name}...`);
const download = await fetch(tarball.browser_download_url, {
  headers: { "User-Agent": "WebKontrol-installer", Accept: "application/octet-stream" },
});
if (!download.ok || download.body === null) fail(`Download failed (${download.status}).`);
await pipeline(Readable.fromWeb(download.body), createWriteStream(join(staging, "update.tar.gz")));

log("Extracting...");
// Relative paths + cwd: GNU tar reads an absolute "C:\..." archive path as a remote host.
execFileSync("tar", ["-xzf", "update.tar.gz", "-C", "release"], { cwd: staging });

log("Installing dependencies (this downloads Chromium once, into the shared cache)...");
const install = spawnSync("yarn", ["workspaces", "focus", "--production"], {
  cwd: join(staging, "release"),
  shell: process.platform === "win32",
  stdio: "inherit",
  // The same pin the update runner and the supervisor use: one Chromium for every
  // release, in the root, instead of one per release in a per-user cache.
  env: { ...process.env, PUPPETEER_CACHE_DIR: join(root, "puppeteer") },
});
if (install.status !== 0) fail("Dependency installation failed; the messages above say why.");

// Promote: the release dir appears complete or not at all.
renameSync(join(staging, "release"), join(root, "releases", tag));
rmSync(staging, { recursive: true, force: true });

// A starter config, only when none exists (a prepared config survives installation).
const configFile = join(root, "config", "config.yaml");
if (!existsSync(configFile)) {
  writeFileSync(
    configFile,
    `# WebKontrol configuration. The admin UI manages runtime settings; this file holds\n` +
      `# what must exist before the app starts.\n` +
      `\n` +
      `# Displays this system drives. Example:\n` +
      `# puppets:\n` +
      `#   - id: hall-1\n` +
      `#     name:\n` +
      `#       long: Hallway display\n` +
      `#       short: HALL1\n` +
      `puppets: []\n` +
      `\n` +
      `web:\n` +
      `  port: 80\n`,
  );
  log("Wrote a starter config/config.yaml (edit it to add your displays).");
}

// Activate: pointer first, then the supervisor beside it.
writeFileSync(join(root, "current"), `${tag}\n`);
copyFileSync(join(root, "releases", tag, "dist", "supervisor.js"), join(root, "supervisor.js"));

log(`Installed WebKontrol ${tag} into ${root}.`);
console.log(`
Run it (from the install directory; it is the data home):

    cd ${root}
    node supervisor.js

The admin UI serves on the configured port (config/config.yaml, default 80).
Updates, from now on, happen in the admin UI under Settings.

To start on boot under systemd, a unit like this works:

    [Unit]
    Description=WebKontrol
    After=network-online.target

    [Service]
    WorkingDirectory=${root}
    ExecStart=${process.execPath} ${join(root, "supervisor.js")}
    Restart=always

    [Install]
    WantedBy=multi-user.target
`);
