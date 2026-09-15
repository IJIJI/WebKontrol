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
  /**
   * An update is in flight. Deliberately not "the live activity says APPLYING": a fast
   * apply (a downgrade from disk, a tiny release) can be staged and gone inside the same
   * second, so a client that blinks would never see it. The caller derives this from the
   * persisted journal as well, which stays true for the whole swap.
   */
  applying: boolean;
  /** The last apply failed before swapping anything, so no restart is coming. */
  failed: boolean;
  connected: boolean;
  /**
   * Whether an update has been seen running in this document. Everything after that is
   * the aftermath: the server is going away, and even once it answers again this document
   * still runs the previous version's bundle, so it stays covered until it has reloaded.
   */
  sawApplying: boolean;
  /**
   * The marker found when this document loaded, meaning an update was in flight when the
   * previous one went away: this load is the one after the restart. Deliberately separate
   * from applyingTarget, since only a reload can tell an outcome from an update in flight.
   */
  restartedInto: string | null;
  current: string;
}): UpdatePhase {
  // A failure outranks everything: it ends the story where it started, with the running
  // version untouched, so it must not read as an update still in progress.
  if (input.sawApplying && input.failed) return UpdatePhase.FAILED;
  // While the server can still say it is working, nothing has been swapped yet.
  if (input.applying && input.connected) return UpdatePhase.APPLYING;
  // Either the server is away, or it is back and this document is about to reload onto
  // the new version; both are the same thing to look at.
  if (input.sawApplying) return UpdatePhase.RESTARTING;
  if (input.restartedInto === null) return UpdatePhase.NONE;
  return input.current === input.restartedInto ? UpdatePhase.DONE : UpdatePhase.ROLLED_BACK;
}
