import { UpdateState } from "../../../../src/system/update/model";

/**
 * What the update page should be showing, derived from three sources that each only tell
 * part of the story: the live activity over SSE, whether the connection is still there
 * (a successful update takes the server away), and a marker left in sessionStorage when
 * an apply started, which is the only thing that survives the restart.
 *
 * Pure and CSS-free so the branches can be checked without a browser.
 */
export enum UpdatePhase {
  /** Nothing to show; the page renders normally. */
  NONE = "none",
  /** The runner is working and the server is still answering. */
  APPLYING = "applying",
  /** The server went away mid-update: the new version is starting. */
  RESTARTING = "restarting",
  /** Back up, running the version that was asked for. */
  DONE = "done",
  /** Back up, but running something else: the supervisor rolled the update back. */
  ROLLED_BACK = "rolled-back",
  /** The apply failed before anything was swapped, so no restart is coming. */
  FAILED = "failed",
}

export function updatePhase(input: {
  activity: UpdateState;
  connected: boolean;
  /** The version an apply was started for IN THIS DOCUMENT; null once it reloads. */
  applyingTarget: string | null;
  /**
   * Whether the connection has already dropped during this apply. The server coming back
   * does not end the story: EventSource reconnects by itself, so the page can be talking
   * to the new version while still running the old version's bundle, and it stays covered
   * until it has reloaded.
   */
  sawRestart: boolean;
  /**
   * The marker found when this document loaded, meaning an update was in flight when the
   * previous one went away: this load is the one after the restart. Deliberately separate
   * from applyingTarget, since only a reload can tell an outcome from an update in flight.
   */
  restartedInto: string | null;
  current: string;
}): UpdatePhase {
  // Activity first: while the server still says APPLYING nothing has been swapped yet.
  if (input.activity === UpdateState.APPLYING) return UpdatePhase.APPLYING;
  if (input.applyingTarget !== null) {
    if (input.activity === UpdateState.FAILED) return UpdatePhase.FAILED;
    // The server going away mid-apply is the update working, not an error.
    if (!input.connected || input.sawRestart) return UpdatePhase.RESTARTING;
  }
  if (input.restartedInto === null) return UpdatePhase.NONE;
  return input.current === input.restartedInto ? UpdatePhase.DONE : UpdatePhase.ROLLED_BACK;
}
