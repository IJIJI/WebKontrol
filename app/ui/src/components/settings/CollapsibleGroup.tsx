import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./settings.less";
import { Icons } from "../icons/Icons";

// A SettingGroup whose content folds away behind its title. Used for the Advanced section.
// The caller should only render it when there is content to show.
export function CollapsibleGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: JSX.Element | JSX.Element[];
  defaultOpen?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={"setting group collapsible" + (open ? " open" : "")}>
      <button
        type="button"
        className="label toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Icons.chevronRight size={12} />
        {title}
      </button>
      {open && <div className="content">{children}</div>}
    </div>
  );
}
