import type Database from "better-sqlite3";

import { isNewerVersion, parseVersion } from "../system/update/version";

/**
 * The persisted-data migration chain: how a database from an older release becomes one
 * the current release can read. Position in the array is the step number, and
 * `PRAGMA user_version` records how many steps a database has had applied.
 *
 * THE CONTRACT every step is written under:
 *
 * - The schema-derived bootstrap in CoreDatabase owns CREATION and runs first: any table
 *   missing from a database is created there, in its final shape. A step therefore may
 *   TRANSFORM data and ALTER tables that existed before its release, but never CREATE a
 *   schema table. Breaking this collides on old databases jumping several releases.
 * - Forward only, no down(): going back is the update manager RESTORING the pre-migrate
 *   snapshot alongside the old code. Reversal in place deliberately does not exist.
 * - Most changes need no step at all: a new optional field in a stored JSON value is
 *   covered by its zod default. A step is for what old data would silently misread,
 *   renames and restructures above all (zod drops unknown keys, so a renamed field
 *   quietly resets to its default; the step is what carries the value over).
 * - Each entry names the release that introduced it, and that is ALL the update gate
 *   needs: a downgrade is lossy exactly when it crosses an entry, derived from this
 *   chain (the downgrading side is always the newer one, so it always has the full
 *   history). The chain is append-only with non-decreasing versions, none beyond the
 *   package version; `yarn check` holds those properties down.
 */
export interface Migration {
  /** The release this entry first ships in ("3.1.0"): the gate's derivation key. */
  version: string;
  /** One line, imperative, e.g. "Move puppet assignments into their own keys". */
  description: string;
  up: (db: Database.Database) => void;
}

/** Entry N sits at index N and takes a database from user_version N to N+1. */
export const MIGRATIONS: Migration[] = [];

/**
 * The migration versions separating a target release from the current one: what a
 * downgrade would cross, and therefore what data it would lose. Empty means lossless.
 * Upgrades come out empty by construction (nothing sits above the target when the target
 * is the newer side), so callers need no direction check of their own. Takes bare
 * versions rather than entries so the harness's gate-only fakes go through the same
 * derivation as the real chain.
 */
export function crossedMigrations(
  migrationVersions: string[],
  targetVersion: string,
  currentVersion: string,
): string[] {
  return migrationVersions
    .filter(
      (version) =>
        // Fail closed: an unparsable entry version cannot be placed, so it counts as
        // crossed and blocks the downgrade. (The check file forbids shipping one at all;
        // this is the runtime belt to that build-time braces.)
        !parseVersion(version) ||
        (isNewerVersion(version, targetVersion) && !isNewerVersion(version, currentVersion)),
    );
}

export interface MigrationResult {
  from: number;
  to: number;
  /** Descriptions of the steps that actually ran, in order; empty on a no-op boot. */
  ran: string[];
}

/**
 * Bring a database up to the chain's version. Pure mechanics with no logging or paths,
 * so the check file can drive it against `:memory:` databases; CoreDatabase owns the
 * real handle and reports the result.
 *
 * @param fresh - The bootstrap found no tables and built the current shape from the schema,
 *   so the steps' work is already done: stamp the top without running anything. An old
 *   database is NOT fresh, and its default user_version of 0 is genuinely step 0.
 */
export function runMigrations(
  db: Database.Database,
  chain: Migration[],
  fresh: boolean,
): MigrationResult {
  const from = db.pragma("user_version", { simple: true }) as number;

  // Ahead of the code: this build cannot know what that data means, and running old
  // steps over it would corrupt silently. Crashing is deliberate; on a managed device
  // it is what hands control to the supervisor's rollback. Also the safety net for a
  // release whose schemaStep was bumped wrongly: it dies on boot instead of running.
  if (from > chain.length)
    throw new Error(
      `Database is at schema step ${from}, but this build only knows ${chain.length}. ` +
        `This code is older than the data; refusing to touch it.`,
    );

  if (fresh) {
    db.pragma(`user_version = ${chain.length}`);
    return { from, to: chain.length, ran: [] };
  }

  const ran: string[] = [];
  for (let step = from; step < chain.length; step++) {
    const migration = chain[step];
    try {
      // One transaction per step, bump included (user_version lives in the database
      // header and rolls back with it): a step fully happened or did not happen at all.
      db.transaction(() => {
        migration.up(db);
        db.pragma(`user_version = ${step + 1}`);
      })();
    } catch (error) {
      throw new Error(
        `Migration step ${step} ("${migration.description}") failed; ` +
          `the database remains at step ${step}.`,
        { cause: error },
      );
    }
    ran.push(migration.description);
  }
  return { from, to: chain.length, ran };
}
