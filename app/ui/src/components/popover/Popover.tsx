import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const place = (): void => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
  };

  const show = (): void => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    place();
    setOpen(true);
  };

  const hide = (): void => {
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
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
  }, [open]);

  return (
    <span
      ref={anchorRef}
      className="popoverAnchor"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={() => (open ? setOpen(false) : show())}
    >
      {children}
      {open &&
        createPortal(
          <div
            className="popoverPanel"
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
