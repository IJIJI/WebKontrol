// One backoff curve for everything that retries. Navigation retries, crash repairs and
// puppet relaunches share the same philosophy (fast first, escalate to a cap, never
// stop), so they share one curve; each owner picks its own bounds, because a cheap
// retry (re-navigating) tolerates a much lower cap than a heavy one (launching
// Chromium).

// ponytail: fixed pacing constants, make configurable if a deployment ever needs tuning.
export interface BackoffPacing {
  baseMs: number;
  capMs: number;
}

export const DEFAULT_PACING: BackoffPacing = { baseMs: 2_000, capMs: 5 * 60_000 };

export const REPAIR_WINDOW_MS = 10 * 60_000;

/** Exponential backoff: escalation 1 is the base delay, doubling to the cap; 0 or less is immediate. */
export function backoffDelay(escalation: number, pacing: BackoffPacing = DEFAULT_PACING): number {
  if (escalation <= 0) return 0;
  return Math.min(pacing.baseMs * 2 ** (escalation - 1), pacing.capMs);
}

/**
 * Delay before the next repair, from the number of crashes inside the window (including
 * the one just recorded). A first crash repairs immediately; density escalates. The
 * sliding window is also the reset: old crashes age out, so there is no reset
 * bookkeeping to get wrong.
 */
export function repairDelay(recentCrashes: number): number {
  return backoffDelay(recentCrashes - 1);
}

/**
 * The bookkeeping of a retry loop: one pending timer plus the attempt count that drives
 * the curve. Only the bookkeeping, the part that can leak timers or double-fire; the
 * policy (what to retry, what resets, what enters at the cap) stays with the owner.
 */
export class RetryHandler {
  private _attempts = 0;
  private _timer?: ReturnType<typeof setTimeout>;

  constructor(private readonly _pacing: BackoffPacing = DEFAULT_PACING) {}

  get isPending(): boolean {
    return this._timer !== undefined;
  }

  /**
   * Schedule the next attempt on the curve (or at the cap, for failures where fast
   * retries provably change nothing). Absorbed when one is already pending.
   * @returns the delay in ms, or undefined when absorbed.
   */
  schedule(task: () => void, opts?: { atCap?: boolean }): number | undefined {
    if (this._timer !== undefined) return undefined;
    this._attempts += 1;
    const delay = opts?.atCap ? this._pacing.capMs : backoffDelay(this._attempts, this._pacing);
    this._setTimer(task, delay);
    return delay;
  }

  /** Schedule with a caller-computed delay (the crash-density window), attempts untouched. */
  scheduleIn(delayMs: number, task: () => void): boolean {
    if (this._timer !== undefined) return false;
    this._setTimer(task, delayMs);
    return true;
  }

  /** Drop the pending attempt, keep the escalation. */
  cancel(): void {
    if (this._timer === undefined) return;
    clearTimeout(this._timer);
    this._timer = undefined;
  }

  /** Back to square one: cancel and forget the escalation. For when the retried thing succeeded or its inputs changed. */
  reset(): void {
    this.cancel();
    this._attempts = 0;
  }

  private _setTimer(task: () => void, delayMs: number): void {
    this._timer = setTimeout(() => {
      this._timer = undefined;
      task();
    }, delayMs);
  }
}
