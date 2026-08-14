// One backoff curve for everything that retries. Navigation retries and crash repairs
// share the same philosophy (fast first, escalate to a cap, never stop), so they share
// one curve and one set of constants: a crash-looping page or an unreachable target
// settles into "retried every few minutes" and heals the moment the cause goes away.

// ponytail: fixed pacing constants, make configurable if a deployment ever needs tuning.
export const REPAIR_WINDOW_MS = 10 * 60_000;
export const DELAY_CAP_MS = 5 * 60_000;
const BASE_DELAY_MS = 2_000;

/** Exponential backoff: escalation 1 is the base delay, doubling to the cap; 0 or less is immediate. */
export function backoffDelay(escalation: number): number {
  if (escalation <= 0) return 0;
  return Math.min(BASE_DELAY_MS * 2 ** (escalation - 1), DELAY_CAP_MS);
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
