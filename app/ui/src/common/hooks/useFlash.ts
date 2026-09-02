import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A boolean that switches itself back off. For confirming an action that leaves nothing on
 * screen to show it happened (copying), where the control itself can say so for a moment and a
 * toast would be heavier than the action deserves.
 */
// TODO: Generalise, more places could use this.
export function useFlash(ms = 1400): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A pending flash outliving its component would set state on an unmounted one.
  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = useCallback(() => {
    setOn(true);
    clearTimeout(timer.current); // repeated clicks restart the window rather than cutting it short
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);

  return [on, flash];
}
