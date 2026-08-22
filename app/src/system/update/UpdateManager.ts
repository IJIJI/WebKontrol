import EventEmitter from "node:events";
import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";

import pkg from "../../../package.json" with { type: "json" };
import { Logger } from "../../logging/Logger";
import { crossedMigrations, MIGRATIONS } from "../../storage/migrations";
import { UpdateStore } from "../../storage/stores/UpdateStore";
import type { UpdateWebhandlers } from "../../webServer/model";
import type { GitHubReleases } from "./GitHubReleases";
import { UpdateState, type Release, type UpdateActivity, type UpdateInfo } from "./model";
import { planUpdate } from "./plan";
import type { UpdateJournalEntry } from "./schema";
import type { UpdateRunner } from "./UpdateRunner";
import { isNewerVersion } from "./version";

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
// The supervisor deletes pending.json after its 60s healthy-uptime window; this fires
// after that with margin, so normally it only records the confirmation. Without a
// supervisor (bare serve:app) it also deletes the file itself: 90s alive is healthy by
// any definition, and an orphaned pending file would block every future apply.
const CONFIRM_DELAY_MS = 90 * 1000;

/**
 * An apply the gate turned down: a normal, expected answer (wrong mode, unknown version,
 * an update still settling), not a failure. Carried as its own type so the web layer can
 * answer 409 instead of dressing a house rule up as a server error.
 */
export class UpdateRefusedError extends Error {}

/**
 * Whether an apply may start, as a pure decision so the check file can hold it down.
 * Returns the refusal reason, or null when the apply is allowed.
 */
// TODO: Defined interface for input
export function applyGate(input: {
  managed: boolean;
  applying: boolean;
  pendingExists: boolean;
  current: string;
  /** The release found in the LAST CHECK's list, which is the allowlist: an arbitrary
   *  request body version that matched nothing arrives here as undefined. */
  target: Release | undefined;
  /** The migration versions a downgrade to the target would cross, derived from this
   *  build's own chain (the downgrading side is always the newer one, so it holds the
   *  full history). Empty for upgrades by construction. */
  crossedVersions: string[];
}): string | null {
  if (!input.managed) return "This deployment is managed by git; update from the checkout.";
  if (input.applying) return "An update is already in progress.";
  if (input.pendingExists)
    return "The last update is still being confirmed; it can be replaced once it has proven itself.";
  if (!input.target) return "Unknown release; check for updates first.";
  if (input.target.version === input.current) return "This version is already running.";
  // Crossing a migration means the target would misread today's data: lossy, refused.
  // Upgrades never cross anything (forward is what the chain itself is for).
  if (input.crossedVersions.length > 0)
    return `Downgrading past the database changes of ${input.crossedVersions.join(", ")} would lose data.`;
  return null;
}

/**
 * The update to announce after a check, as a pure decision so the check file can hold it
 * down: GitHub's latest, when it is newer than what runs. Nothing else is ever announced.
 * A flagged pre-release is never GitHub's latest (their rule), so it never gets the badge;
 * the UI mentions it quietly from the list, where the flag already sits on the release.
 */
export function announce(input: {
  releases: Release[];
  latest: string | null;
  current: string;
}): Release | undefined {
  return input.releases.find(
    (release) => release.version === input.latest && isNewerVersion(release.version, input.current),
  );
}

export type UpdateManagerEvents = {
  info_update: [info: UpdateInfo];
};

/**
 * The facade over the update parts: the source knows what exists, the runner knows how
 * to touch the disk, this knows whether and when. Managed mode is detected by the
 * `current` pointer file; a plain git checkout (dev) gets a dormant manager whose info
 * says so and whose apply refuses.
 */
export class UpdateManager extends EventEmitter<UpdateManagerEvents> {
  private _logger = new Logger(["UPDATE"]);
  private _store = new UpdateStore();

  private _managed = false;
  private _current: string = pkg.version;
  private _checkError?: string;
  private _activity: UpdateActivity = { state: UpdateState.IDLE };
  private _journal: UpdateJournalEntry | null = null;

  // What the downgrade gate derives from: the real chain, plus the config's gate-only
  // fakes (a harness/dev seam; empty everywhere real).
  private readonly _migrationVersions: string[];

  constructor(
    private readonly _source: GitHubReleases,
    private readonly _runner: UpdateRunner,
    /** Wired to app.ts's beginShutdown: a clean exit the supervisor restarts. Never a
     *  self-signal, which Windows cannot deliver. */
    private readonly _requestRestart: () => void,
    fakeMigrationVersions: string[] = [],
  ) {
    super();
    this._migrationVersions = [
      ...MIGRATIONS.map((migration) => migration.version),
      ...fakeMigrationVersions,
    ];
  }

  public async init(): Promise<void> {
    this._managed = existsSync(this._runner.pointerFile);
    if (!this._managed) {
      this._logger.info("Plain checkout (no release pointer): updates are managed by git.");
      return;
    }
    // The pointer names the running release dir (the published tag), and is what plans
    // and retention use as "from"; the baked package.json version is display-side truth
    // for plain mode only.
    this._current = (await readFile(this._runner.pointerFile, "utf8")).trim();
    await this._runner.cleanStaging();
    await this._reconcileBoot();
    void this._check(); // boot check; failures land in checkError, never throw
    setInterval(() => void this._check(), CHECK_INTERVAL_MS).unref();
  }

  public getInfo(): UpdateInfo {
    return {
      current: this._current,
      managed: this._managed,
      // Each release annotated with what downgrading to it would lose, so the UI can
      // disable a button that the gate would refuse anyway instead of letting it fail.
      releases: this._source.releases.map((release) => ({
        ...release,
        crossings: crossedMigrations(this._migrationVersions, release.version, this._current),
      })),
      lastChecked: this._source.lastChecked,
      checkError: this._checkError,
      activity: this._activity,
      journal: this._journal ?? undefined,
    };
  }

  public getHandlers(): UpdateWebhandlers {
    return {
      check: () => this._check(),
      apply: (version: string) => this.apply(version),
      acknowledge: () => this.acknowledge(),
    };
  }

  /**
   * Mark the last update's outcome as seen. The record stays (it is the answer to "what
   * happened to this device"), it just stops asking for attention.
   */
  public async acknowledge(): Promise<void> {
    if (this._journal === null || this._journal.acknowledged === true) return;
    this._journal = { ...this._journal, acknowledged: true };
    await this._store.saveJournal(this._journal);
    this._logger.info(`Update outcome (${this._journal.status}) acknowledged.`);
    this._emitInfo();
  }

  /** Gate, journal "applying", then hand the runner its plan in the background: the
   *  request returns once the update is legitimate, not once it is done, since the end
   *  of a successful apply is this process restarting. */
  public async apply(version: string): Promise<void> {
    const target = this._source.releases.find((release) => release.version === version);
    const refusal = applyGate({
      managed: this._managed,
      applying: this._activity.state === UpdateState.APPLYING,
      pendingExists: existsSync(this._runner.pendingFile),
      current: this._current,
      target,
      crossedVersions:
        target === undefined
          ? []
          : crossedMigrations(this._migrationVersions, target.version, this._current),
    });
    if (refusal !== null || target === undefined)
      throw new UpdateRefusedError(refusal ?? "Unknown release.");

    // APPLYING is set synchronously with the gate: an await between them would let a
    // second concurrent apply through before the first one is visible.
    this._logger.important(`Applying update: ${this._current} to ${target.version}.`);
    this._setActivity({ state: UpdateState.APPLYING, target });
    this._journal = { from: this._current, to: target.version, moment: Date.now(), status: "applying" };
    await this._store.saveJournal(this._journal);
    this._emitInfo();

    const plan = planUpdate({
      from: this._current,
      to: target,
      targetPresent: existsSync(this._runner.releaseDir(target.version)),
    });
    void this._runner
      .run(plan)
      .then(() => {
        this._logger.important(`Update to ${target.version} staged; restarting to activate.`); // TODO: Check if this is exaustive, and has no edgecases.
        this._requestRestart();
      })
      .catch(async (error) => {
        const message = (error as Error).message;
        this._logger.error(`Update failed:`, error);
        this._journal = { from: this._current, to: target.version, moment: Date.now(), status: "failed", error: message };
        await this._store.saveJournal(this._journal);
        this._setActivity({ state: UpdateState.FAILED, target, error: message });
      });
  }

  private async _check(): Promise<void> {
    if (!this._managed) return;
    if (this._activity.state === UpdateState.APPLYING) return;
    this._setActivity({ state: UpdateState.CHECKING });
    try {
      await this._source.check();
      this._checkError = undefined;
    } catch (error) {
      this._checkError = (error as Error).message;
      this._logger.warn(`Update check failed: ${this._checkError}`);
    }
    // An apply accepted while the check was on the wire owns the activity now: writing
    // READY/IDLE over its APPLYING would reopen the gate to a second apply mid-download.
    // (Read through a method: TS narrowed `_activity` at the guard above and does not
    // know the awaits let apply() run in between.)
    if (this.getInfo().activity.state === UpdateState.APPLYING) return;
    const ready = announce({
      releases: this._source.releases,
      latest: this._source.latest,
      current: this._current,
    });
    this._setActivity(
      ready !== undefined ? { state: UpdateState.READY, latest: ready } : { state: UpdateState.IDLE },
    );
  }

  /**
   * Settle what the last apply became. Waking up as a version the journal did not aim
   * for means the supervisor rolled back. Waking up as the target is only provisional:
   * the crash window is still open, so confirmation waits out the healthy window, and a
   * journal left "applying" by a crash gets settled correctly by whichever version's
   * boot runs next. The supervisor copy re-runs every boot (self-healing adoption).
   */
  private async _reconcileBoot(): Promise<void> {
    this._journal = await this._store.loadJournal();
    if (this._journal?.status === "applying") {
      if (this._current !== this._journal.to) {
        this._journal = { ...this._journal, status: "rolled-back" };
        await this._store.saveJournal(this._journal);
        this._logger.error(
          `Update to ${this._journal.to} did not survive; the supervisor rolled back to ${this._current}.`,
        );
      } else {
        setTimeout(() => void this._confirmUpdate(), CONFIRM_DELAY_MS).unref();
      }
    }
    await this._runner.run([{ kind: "adopt-supervisor", version: this._current }]);
  }

  private async _confirmUpdate(): Promise<void> {
    if (existsSync(this._runner.pendingFile)) {
      await rm(this._runner.pendingFile, { force: true });
      this._logger.warn("No supervisor cleared pending.json; confirmed the update unsupervised.");
    }
    if (this._journal?.status !== "applying") return;
    this._journal = { ...this._journal, status: "ok" };
    await this._store.saveJournal(this._journal);
    this._logger.important(`Update to ${this._journal.to} confirmed healthy.`);
    this._emitInfo();
  }

  private _setActivity(activity: UpdateActivity): void {
    this._activity = activity;
    this._emitInfo();
  }

  private _emitInfo(): void {
    this.emit("info_update", this.getInfo());
  }
}
