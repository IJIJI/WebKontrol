import { type CSSProperties, type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./entityHeader.less";
import { FrameBox } from "../frameBox/FrameBox";

// A generic detail-page header: a coloured icon badge, a title with optional subtitle and chips,
// and a right-aligned actions area. Shared by ViewHeader / PuppetHeader / etc. — the wrappers
// fill the slots, and the entity kind is conveyed by that content (icon, chips, actions), not by
// the base. `color` tints both the badge and the header's glow.
export function EntityHeader({
  icon,
  color,
  title,
  subtitle,
  chips,
  actions,
}: {
  icon: ReactNode;
  color: string;
  title: ReactNode;
  subtitle?: ReactNode;
  chips?: ReactNode;
  actions?: ReactNode;
}): JSX.Element {
  return (
    <header className="entityHeader" style={{ "--entity-color": color } as CSSProperties}>
      <FrameBox color={color} className="icon">
        {icon}
      </FrameBox>

      <div className="titleBlock">
        <h1 className="title">{title}</h1>
        {subtitle != null && <div className="subtitle">{subtitle}</div>}
        {chips != null && <div className="chips">{chips}</div>}
      </div>

      {actions != null && <div className="actions">{actions}</div>}
    </header>
  );
}
