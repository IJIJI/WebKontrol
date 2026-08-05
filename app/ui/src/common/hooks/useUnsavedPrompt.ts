import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

// Confirm-before-leaving while there are unsaved changes. Two mechanisms cover the two ways out:
// beforeunload for tab close / reload / browser-level navigation (the browser's own prompt is
// the only UI allowed there), and a router blocker for in-app route changes.
export function useUnsavedPrompt(dirty: boolean): void {
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
  // TODO: styled ConfirmModal instead of window.confirm. confirm blocks the thread.
  // and can't match the app's look.
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("You have unsaved changes. Leave without saving?")) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
}
