import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./groupChipPill.less";
import { Popover } from "../popover/Popover";

// Base of the group-pill family: a pill with a floating panel on hover/focus/tap.
export function GroupChipPill({
  content,
  children,
}: {
  content: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return <Popover content={<div className="groupPanel">{content}</div>}>{children}</Popover>;
}
