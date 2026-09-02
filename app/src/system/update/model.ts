import type { UpdateJournalEntry } from "./schema";

/**
 * Model types for the update system: internally created, no validation needed.
 * Follows the puppet model's shape: a state union for the transient activity
 * (impossible combinations don't compile), wrapped with the common fields.
 */

/** A published release carrying an update tarball, as reported by the source. */
export interface Release {
  version: string; // the tag as published, "v3.1.0" or "3.1.0-beta.2"
  name: string;
  notes: string; // release body, markdown
  publishedAt: string;
  prerelease: boolean;
  assetUrl: string; // download URL of the update tarball asset
  /**
   * The migration versions a downgrade to this release would cross, derived from the
   * running build's own chain (empty for upgrades by construction). Set by the manager
   * when it builds the info payload; the source itself knows nothing about migrations.
   */
  crossings?: string[];
}

export enum UpdateState {
  IDLE = "Idle",         // nothing newer known, nothing running
  CHECKING = "Checking",
  READY = "Ready",       // a newer release is known, waiting for a manual apply
  APPLYING = "Applying",
  FAILED = "Failed",     // the last apply failed; superseded by the next check or apply
}

export type UpdateActivity =
  | { state: UpdateState.IDLE }
  | { state: UpdateState.CHECKING }
  | { state: UpdateState.READY; latest: Release }
  | { state: UpdateState.APPLYING; target: Release }
  | { state: UpdateState.FAILED; target: Release; error: string };

/** The update section of the SSE state payload. */
export interface UpdateInfo {
  current: string;
  managed: boolean; // false = plain checkout (dev), checks and applies are off
  releases: Release[];
  /** The tag GitHub marks as latest (newest stable, or the maintainer's override); null
   *  while no stable release exists. Carried so the list can badge it regardless of
   *  whether it is newer than what runs (the READY activity only knows the newer case). */
  latest: string | null;
  lastChecked: number | null;
  checkError?: string; // why the last check failed; cleared by a successful one
  activity: UpdateActivity;
  journal?: UpdateJournalEntry; // the most recent apply's outcome; absent before the first
}
