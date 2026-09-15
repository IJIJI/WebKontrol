import { execFile } from "node:child_process";
import { createWriteStream, existsSync } from "node:fs";
import { copyFile, mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

import { Logger } from "../../logging/Logger";
import type { UpdateStep } from "./plan";

const execFileAsync = promisify(execFile);

const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000; // a Pi on slow wifi pulling a full tarball
const INSTALL_TIMEOUT_MS = 15 * 60 * 1000; // native builds (better-sqlite3) on a Pi

/** What the supervisor reads after a crash to decide whether and where to roll back. */
export interface PendingUpdate {
  from: string;
  to: string;
  dbBackup: string;
}

/**
 * The I/O half of an update: executes a plan's steps against the managed layout.
 * No decisions live here beyond "how does this step touch the disk"; what runs and in
 * which order is the plan's, and whether it may run at all is the manager's.
 *
 * Layout, all under one root (the process cwd in production):
 *   releases/<version>/   a complete release: dist + node_modules + package.json
 *   releases/.staging/    the one being built; wiped at apply-start and at boot
 *   releases/pending.json exists only mid-update, the supervisor rollback protocol
 *   current               text file naming the active release dir
 *   supervisor.js         best-effort copy from the active release, .prev kept
 */
export class UpdateRunner {
  private _logger = new Logger(["UPDATE", "RUNNER"]);

  constructor(
    private readonly _root: string,
    /** Writes a consistent snapshot of the live db to the given path (db.backup underneath). */
    private readonly _snapshotDb: (dest: string) => Promise<void>,
  ) {}

  releaseDir(version: string): string {
    return join(this._root, "releases", version);
  }
  get pointerFile(): string {
    return join(this._root, "current");
  }
  get pendingFile(): string {
    return join(this._root, "releases", "pending.json");
  }
  private get _staging(): string {
    return join(this._root, "releases", ".staging");
  }
  private get _snapshotFile(): string {
    return join(this._root, "db", "update-snapshot.db");
  }

  /** Boot hygiene: a crash mid-download or mid-install leaves only staging debris. */
  async cleanStaging(): Promise<void> {
    await rm(this._staging, { recursive: true, force: true });
  }

  /** Executes the steps in order; throws on the first failure, naming the step. */
  async run(steps: UpdateStep[]): Promise<void> {
    for (const step of steps) {
      this._logger.info(`Step: ${step.kind}`);
      try {
        await this._execute(step);
      } catch (error) {
        throw new Error(`Update failed at ${step.kind}: ${(error as Error).message}`, {
          cause: error,
        });
      }
    }
  }

  private async _execute(step: UpdateStep): Promise<void> {
    switch (step.kind) {
      case "clean-staging": {
        await this.cleanStaging();
        await mkdir(this._staging, { recursive: true });
        return;
      }
      case "download": {
        const response = await fetch(step.url, {
          headers: { "User-Agent": "WebKontrol", Accept: "application/octet-stream" },
          signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
        });
        if (!response.ok || response.body === null)
          throw new Error(`Download error: ${response.status}`);
        await pipeline(
          // The cast bridges the DOM and node:stream/web ReadableStream types, which
          // describe the same object but disagree on buffer generics.
          Readable.fromWeb(response.body as WebReadableStream<Uint8Array>),
          createWriteStream(join(this._staging, "update.tar.gz")),
        );
        return;
      }
      case "extract": {
        // The tarball is flat (dist/, package.json, yarn.lock, .yarnrc.yml at its root),
        // a contract with the CI workflow.
        await mkdir(join(this._staging, "release"), { recursive: true });
        // Relative paths + cwd on purpose: GNU tar reads an absolute "C:\..." archive
        // path as a remote host ("Cannot connect to C"), and which tar wins the PATH
        // varies per machine. Relative paths behave the same on every tar.
        await this._exec("tar", ["-xzf", "update.tar.gz", "-C", "release"], {
          cwd: this._staging,
        });
        return;
      }
      case "install-deps": {
        // Verified 2026-08-18 (yarn 4.9.2): focus --production works on a plain
        // non-workspace root and skips devDependencies. The pinned cache keeps
        // Chromium downloaded once for all releases instead of once per release.
        await this._exec("yarn", ["workspaces", "focus", "--production"], {
          cwd: join(this._staging, "release"),
          env: { ...process.env, PUPPETEER_CACHE_DIR: join(this._root, "puppeteer") },
          timeout: INSTALL_TIMEOUT_MS,
        });
        return;
      }
      case "promote": {
        const dir = this.releaseDir(step.version);
        await rm(dir, { recursive: true, force: true }); // a swept or stale same-version dir
        await rename(join(this._staging, "release"), dir);
        return;
      }
      case "snapshot-db": {
        // Written beside the live db via a temp name so a crash mid-backup can never
        // leave a plausible-looking half snapshot for the rollback to restore.
        await this._snapshotDb(`${this._snapshotFile}.tmp`);
        await rename(`${this._snapshotFile}.tmp`, this._snapshotFile);
        return;
      }
      case "write-pending": {
        const pending: PendingUpdate = { from: step.from, to: step.to, dbBackup: this._snapshotFile };
        await writeFile(this.pendingFile, JSON.stringify(pending));
        return;
      }
      case "activate": {
        await writeFile(`${this.pointerFile}.tmp`, step.version);
        await rename(`${this.pointerFile}.tmp`, this.pointerFile);
        return;
      }
      case "adopt-supervisor": {
        // Best-effort by design: the running supervisor is what restarts us, and a copy
        // failure must not fail an otherwise complete update.
        try {
          const source = join(this.releaseDir(step.version), "dist", "supervisor.js");
          const target = join(this._root, "supervisor.js");
          if (existsSync(target)) await copyFile(target, `${target}.prev`);
          await copyFile(source, target);
        } catch (error) {
          this._logger.warn(`Supervisor self-update skipped: ${(error as Error).message}`);
        }
        return;
      }
      case "sweep-releases": {
        // Best-effort by design, like adopt-supervisor: this runs after the swap, so a
        // failure here (Windows holding a file open inside an old node_modules) must not
        // mark a completed update as failed and skip its restart. A dir left behind only
        // costs disk and is retried by the next update's sweep.
        const releasesDir = join(this._root, "releases");
        for (const entry of await readdir(releasesDir, { withFileTypes: true })) {
          if (!entry.isDirectory() || entry.name === ".staging") continue;
          if (step.keep.includes(entry.name)) continue;
          this._logger.info(`Removing retired release ${entry.name}.`);
          try {
            await rm(join(releasesDir, entry.name), { recursive: true, force: true });
          } catch (error) {
            this._logger.warn(`Could not remove ${entry.name}; left for the next sweep:`, error);
          }
        }
        return;
      }
    }
  }

  private async _exec(
    command: string,
    args: string[],
    options: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {},
  ): Promise<void> {
    // execFile, never a shell string: nothing user-influenced can splice into a command.
    // The shell is granted ONLY to yarn on win32 (a .cmd shim refuses to spawn without
    // one) and yarn's arguments are constant words; a shell would break quoting for
    // arguments with spaces (paths), which tar gets, so everything else runs without.
    await execFileAsync(command, args, {
      timeout: 5 * 60 * 1000,
      ...options,
      shell: process.platform === "win32" && command === "yarn",
      windowsHide: true,
    });
  }
}
