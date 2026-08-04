import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./settings.less";
import { Icons } from "../icons/Icons";
import { classNames } from "../../common/helpers/classNames";

// A SettingGroup whose content folds away behind its title. Used for the Advanced section.
// The caller should only render it when there is content to show. `joined` renders the rows as
// one divided card instead of an island per field (see SettingGroup).
export function CollapsibleGroup({
  title,
  children,
  defaultOpen = false,
  joined,
}: {
  title: string;
  children: JSX.Element | JSX.Element[];
  defaultOpen?: boolean;
  joined?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={classNames("setting", "group", "collapsible", open && "open", joined && "joined")}>
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
