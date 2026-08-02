import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { type JSX } from "react/jsx-runtime";

import "./modal.less";
import { Icons } from "../icons/Icons";

export enum ModalSize { // TODO: Generalise to a WindowSize, SectionSize or ObjectSize?
  SM = "sm",
  MD = "md",
  LG = "lg",
}

// A general modal dialog: portaled to <body>, closes on Esc or backdrop click. `header`/`footer`
// are optional slots; `children` is the body. Size presets bound the panel width.
export function Modal({
  open,
  onClose,
  title,
  footer,
  size = ModalSize.MD,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  children: ReactNode;
}): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modalBackdrop" onClick={onClose}>
      <div
        className={"modalPanel " + size}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHead">
          {title && <h2 className="modalTitle">{title}</h2>}
          <button type="button" className="modalClose" aria-label="Close" onClick={onClose}>
            <Icons.close size={18} />
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer && <div className="modalFoot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
