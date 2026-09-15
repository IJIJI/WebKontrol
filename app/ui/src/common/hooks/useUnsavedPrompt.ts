import { useEffect } from "react";
import { useBlocker, type Blocker } from "react-router-dom";

/**
 * Confirm-before-leaving while there are unsaved changes. Two mechanisms cover the two ways
 * out: beforeunload for tab close / reload / browser-level navigation (the browser's own
 * prompt is the only UI allowed there), and a router blocker for in-app route changes.
 *
 * The blocker is returned rather than resolved here: this hook owns the router wiring, and
 * its caller (SaveBar) owns how the question is asked. `state === "blocked"` means a
 * navigation is waiting on `proceed()` or `reset()`.
 */
export function useUnsavedPrompt(dirty: boolean): Blocker {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      // Chromium still requires returnValue to be set for the prompt to appear.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // In-app navigation; requires the data router in App.tsx.
  return useBlocker(dirty);
}
