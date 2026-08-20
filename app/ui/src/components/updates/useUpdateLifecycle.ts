import { useEffect, useState, useSyncExternalStore } from "react";

import { UpdateState } from "../../../../src/system/update/model";
import { useApi } from "../../context/ApiStateContext";
import { ConnectionStatus } from "../../context/types";
import { updatePhase, UpdatePhase } from "./updatePhase";

// Survives the restart an update ends in, which is the only reason a browser can say
// anything about the outcome afterwards. Only the instance that started the update has
// it, so only that one gets told how it went.
const PENDING_KEY = "wk-update-target";

// Read ONCE per document: a marker present at load time means the previous document was
// taken away by an update, so this load is the one that comes after it. Consumed straight
// away (a manual reload must not replay a finished update) and cleared from memory when
// the outcome has been seen, so returning to a page does not replay it either.
let restartedInto: string | null =
  typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(PENDING_KEY);
if (restartedInto !== null) sessionStorage.removeItem(PENDING_KEY);

// What this document asked for, if anything. Kept outside React because the page that
// starts an update is not the component that renders the overlay: this covers the window
// that clicked from the instant it clicks, without waiting for the state to come back.
let startedHere: string | null = null;
const startedListeners = new Set<() => void>();

function publishStarted(version: string | null): void {
  startedHere = version;
  for (const listener of startedListeners) listener();
}

function subscribeStarted(listener: () => void): () => void {
  startedListeners.add(listener);
  return () => startedListeners.delete(listener);
}

/** Called just before an apply request, so the reload afterwards can explain itself. */
export function markApplyStarted(version: string): void {
  sessionStorage.setItem(PENDING_KEY, version);
  restartedInto = version;
  publishStarted(version);
}

/** Called if the apply never actually started (the gate refused it). */
export function clearApplyMark(): void {
  sessionStorage.removeItem(PENDING_KEY);
  restartedInto = null;
  publishStarted(null);
}

export interface UpdateLifecycle {
  phase: UpdatePhase;
  target: string | null;
  error?: string;
  dismiss: () => void;
}

/**
 * The update as the whole admin sees it. Driven by the broadcast state rather than by
 * whoever clicked, so every open admin covers itself while the server is being replaced
 * instead of quietly failing requests at whoever happens to be looking.
 */
export function useUpdateLifecycle(): UpdateLifecycle {
  const api = useApi();
  const info = api.state?.info.update;
  const activity = info?.activity.state ?? UpdateState.IDLE;
  const connected = api.status !== ConnectionStatus.DISCONNECTED;
  const requestedHere = useSyncExternalStore(subscribeStarted, () => startedHere);

  // Three ways to know an update is running, because no single one is reliable. The live
  // activity is authoritative but can come and go inside one second on a fast apply; the
  // journal is persisted, so it still says "applying" for the whole swap and is there for
  // anyone who connects or re-renders late; and this window's own click covers the moment
  // before any of it has come back over the wire.
  const journal = info?.journal;
  const applying =
    requestedHere !== null ||
    activity === UpdateState.APPLYING ||
    (journal?.status === "applying" && info?.current === journal.from);

  // Once an update has been seen running in this document, everything after it is the
  // aftermath: the server is going away, and a reload is the only way back to a matching
  // bundle. Remembered rather than derived, since the server stops answering mid-story.
  const [sawApplying, setSawApplying] = useState(false);
  const [outcomeTarget, setOutcomeTarget] = useState<string | null>(restartedInto);
  const [dismissed, setDismissed] = useState(false);

  // A new update reopens the story: dismissing the last one said "I have seen that", not
  // "never show me this again". Without the reset, one dismissal blinded this document to
  // every later update, which is what made the overlay look unreliable.
  useEffect(() => {
    if (!applying) return;
    setSawApplying(true);
    setDismissed(false);
  }, [applying]);

  // The client is left running the previous version's bundle, and the outcome modal needs
  // a fresh document to tell a finished update from one in flight. Reload as soon as the
  // update has concluded; a failure that never swapped anything stays put.
  useEffect(() => {
    if (!sawApplying || !connected) return;
    if (applying || activity === UpdateState.FAILED) return;
    window.location.reload();
  }, [sawApplying, connected, applying, activity]);

  const phase = dismissed
    ? UpdatePhase.NONE
    : updatePhase({
        applying,
        failed: activity === UpdateState.FAILED,
        connected,
        sawApplying,
        restartedInto: outcomeTarget,
        current: info?.current ?? "",
      });

  const applyingTarget =
    info?.activity.state === UpdateState.APPLYING
      ? info.activity.target.version
      : (requestedHere ?? (journal?.status === "applying" ? journal.to : null));

  return {
    phase,
    target: applyingTarget ?? outcomeTarget,
    error:
      info?.activity.state === UpdateState.FAILED
        ? info.activity.error
        : info?.journal?.status === "rolled-back"
          ? info.journal.error
          : undefined,
    dismiss: () => {
      restartedInto = null; // the story has been told; a remount must not tell it again
      publishStarted(null);
      setOutcomeTarget(null);
      setDismissed(true);
    },
  };
}
