import { type JSX } from "react/jsx-runtime";

import "./blockBadge.less";
import { blockInfo } from "../model/registry";

// A block's type shown as a code-font badge, labelled from the registry's block info (an
// unregistered type falls back to its raw key). Clickable when `onClick` is given (used to
// select/inspect the block); highlighted when `selected`.
export function BlockBadge({
  type,
  onClick,
  selected,
}: {
  type: string;
  onClick?: () => void;
  selected?: boolean;
}): JSX.Element {
  const className = "blockBadge" + (selected ? " selected" : "") + (onClick ? " clickable" : "");
  const label = blockInfo(type)?.label ?? type;

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {label}
      </button>
    );
  }
  return <span className={className}>{label}</span>;
}
