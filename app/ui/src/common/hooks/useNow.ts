import { useEffect, useState } from "react";

/**
 * The current time, refreshed on an interval, for relative timestamps that have to keep moving.
 *
 * A component showing "4 minutes ago" cannot rely on the state broadcast to re-render it: the
 * broadcast only arrives when something actually changes, so a puppet that has been sitting in
 * the same state all morning would still claim it failed seconds ago.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
