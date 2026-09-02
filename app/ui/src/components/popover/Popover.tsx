import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { type JSX } from "react/jsx-runtime";

import "./popover.less";

export function Popover({
  content,
  children,
  closeDelay = 120,
}: {
  content: ReactNode;
  children: ReactNode;
  closeDelay?: number;
}): JSX.Element {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const place = useCallback((): void => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
  }, []);

  const clearClose = (): void => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const show = (): void => {
    clearClose();
    place();
    setOpen(true);
  };

  // Peek close: ignored while pinned.
  const peekClose = (): void => {
    if (pinned) return;
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  const close = useCallback((): void => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setPinned(false);
    setOpen(false);
  }, []);

  // Click/tap toggles the pin (and opens if it wasn't already).
  const togglePin = (): void => {
    if (pinned) close();
    else {
      setPinned(true);
      show();
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") close();
    };
    const reposition = (): void => place();
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, place, close]);

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent): void => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pinned, close]);

  return (
    <span
      ref={anchorRef}
      className="popoverAnchor"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={peekClose}
      onFocus={show}
      onBlur={peekClose}
      onClick={togglePin}
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="popoverPanel"
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={show}
            onMouseLeave={peekClose}
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
