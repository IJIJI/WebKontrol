import { useState, type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./dropdown.less";

export type DropdownItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void | Promise<void>;
  danger?: boolean;
  disabled?: boolean;
};

// A trigger button that opens a small popover menu. Items run their onClick then close the
// menu; a "divider" entry renders a separator. Closes on outside click (transparent backdrop).
export function Dropdown({
  trigger,
  items,
  ariaLabel,
}: {
  trigger: ReactNode;
  items: (DropdownItem | "divider")[];
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
            {items.map((item, i) =>
              item === "divider" ? (
                <hr key={`divider-${i}`} className="dropdownDivider" />
              ) : (
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
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
