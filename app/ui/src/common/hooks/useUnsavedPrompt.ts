import { useEffect } from "react";

// Native confirm-before-leaving while there are unsaved changes: covers tab close, reload, and
// browser-level navigation. In-app route changes are NOT guarded yet, react-router's useBlocker
// needs a data router, and the app still mounts a plain <BrowserRouter> (see backlog).
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
}
