import { useState, type ReactNode } from "react";
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

// A trigger button that opens a small popover menu. Buttons run their onClick then close the
// menu; dividers separate groups. Closes on outside click (transparent backdrop).
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

  return (
    <div className="dropdown">
      <button
        type="button"
        className="dropdownTrigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>

      {open && (
        <>
          <div className="dropdownBackdrop" onClick={() => setOpen(false)} />
          <div className="dropdownMenu" role="menu">
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
          </div>
        </>
      )}
    </div>
  );
}
