import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./settings.less";
import { Icons } from "../icons/Icons";
import { classNames } from "../../common/helpers/classNames";

/**
 * Whether each kind of group is open, keyed by title and shared by every instance: switching
 * between blocks remounts the whole settings tree, and re-folding Style on every switch makes
 * it useless for the one job it has. Keyed by title rather than by path on purpose, so the
 * state follows the *kind* of section (open Style once, it stays open for every block).
 *
 * Module level rather than a context: it needs no provider to mount, and living for the page
 * session is the behaviour anyone would expect. Deliberately not persisted, a fold state is not
 * worth a storage key.
 */
const openByTitle = new Map<string, boolean>();

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
  // The shared map is the source of truth; local state exists only to re-render this instance.
  const [open, setOpen] = useState(openByTitle.get(title) ?? defaultOpen);

  const toggle = (): void => {
    const next = !open;
    openByTitle.set(title, next);
    setOpen(next);
  };

  return (
    <div className={classNames("setting", "group", "collapsible", open && "open", joined && "joined")}>
      <button
        type="button"
        className="label toggle"
        onClick={toggle}
        aria-expanded={open}
      >
        <Icons.chevronRight size={12} />
        {title}
      </button>
      {open && <div className="content">{children}</div>}
    </div>
  );
}
