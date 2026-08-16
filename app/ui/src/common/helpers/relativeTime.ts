// Pinned to English rather than the system locale: the rest of the UI is written in English, so
// a Dutch "4 minuten geleden" beside an English label would read worse than no translation at all.
const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "always" });

// Largest first: the first unit the elapsed time reaches is the one worth saying.
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1_000],
];

/**
 * A moment as "4 minutes ago". Pass a `now` that moves (see useNow) wherever the value stays on
 * screen: the state broadcast only arrives when something changes, so a row rendered once would
 * keep claiming the same age all morning.
 *
 * Never reports the future. A display without a real-time clock (a Pi syncs NTP some seconds
 * after boot) stamps moments against a wrong clock and then jumps, which would otherwise turn
 * "failed just now" into "failed in 3 hours".
 */
export function timeAgo(moment: number, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - moment);
  for (const [unit, ms] of STEPS) {
    if (elapsed >= ms) return RELATIVE.format(-Math.floor(elapsed / ms), unit);
  }
  return "just now";
}
