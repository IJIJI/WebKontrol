import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

// Shared open/close state for the detail pane's collapsibles (groups and wrapper items).
export function useDisclosure(defaultOpen = false): { open: boolean; toggle: () => void } {
  const [open, setOpen] = useState(defaultOpen);
  return { open, toggle: () => setOpen((o) => !o) };
}

// The disclosure caret shared by every collapsible head.
// TODO: Animate?
export function Caret({ open }: { open: boolean }): JSX.Element {
  return (
    <span className="caret" aria-hidden="true">
      {open ? "▾" : "▸"}
    </span>
  );
}
