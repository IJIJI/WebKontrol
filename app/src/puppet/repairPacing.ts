// Pacing for the crash-repair cycle. Repair is event-triggered (a crash event fires it),
// so unlike every other retry in the system there is no timer inherently in the loop: a
// page that crashes the renderer on every load (WebGL on broken drivers) would otherwise
// spin as fast as Chromium can crash. Paced, never stopped, matching the retry-forever
// philosophy: a crash-looping page settles into "works briefly every few minutes" and
// heals fully the moment the cause goes away.

// ponytail: fixed pacing constants, make configurable if real hardware ever needs tuning.
export const REPAIR_WINDOW_MS = 10 * 60_000;
const REPAIR_BASE_DELAY_MS = 2_000;
const REPAIR_DELAY_CAP_MS = 5 * 60_000;

/**
 * Delay before the next repair attempt, from the number of crashes inside the window
 * (including the one just recorded). A first crash repairs immediately; density
 * escalates the delay. The sliding window is also the reset: old crashes age out, so
 * there is no reset bookkeeping to get wrong.
 */
export function repairDelay(recentCrashes: number): number {
  if (recentCrashes <= 1) return 0;
  return Math.min(REPAIR_BASE_DELAY_MS * 2 ** (recentCrashes - 2), REPAIR_DELAY_CAP_MS);
}
