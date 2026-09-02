import { useState, useRef, useEffect, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { type JSX } from "react/jsx-runtime";

import "./dropdown.less";

// A clickable menu entry.
export type DropdownButton = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void | Promise<void>;
  danger?: boolean;
  disabled?: boolean;
};

// A separator line, optionally with a label shown in a break of the line (a mini section heading).
export type DropdownDivider = {
  divider: true;
  label?: string;
};

// Anything that can appear in a Dropdown's item list.
export type DropdownItem = DropdownButton | DropdownDivider;

// A trigger button that opens a small popover menu. The menu is portaled to <body> and positioned
// from the trigger, so it escapes the page sections' stacking contexts and layers at the global
// @z-dropdown level. It closes on an outside click (a plain document listener — no overlay, so the
// click still reaches whatever you clicked) or on scroll/resize.
export function Dropdown({
  trigger,
  items,
  ariaLabel,
}: {
  trigger: ReactNode;
  items: DropdownItem[];
  ariaLabel?: string;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Anchor the fixed menu under the trigger (right edges aligned) when it opens.
  useLayoutEffect(() => {
    if (!open) return;
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false); // outside click: close, but don't consume — the click still lands
    };
    const close = (): void => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="dropdown">
      <button
        ref={triggerRef}
        type="button"
        className="dropdownTrigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>

      {open &&
        pos !== null &&
        createPortal(
          <div className="dropdownMenu" role="menu" ref={menuRef} style={{ top: pos.top, right: pos.right }}>
            {items.map((item, i) => {
              if ("divider" in item) {
                return item.label ? (
                  <div key={`divider-${i}`} className="dropdownDivider labeled">
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <hr key={`divider-${i}`} className="dropdownDivider" />
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={"dropdownItem" + (item.danger ? " danger" : "")}
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    void item.onClick();
                  }}
                >
                  {item.icon}
                  <span className="label">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
