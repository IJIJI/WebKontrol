import { type JSX } from "react/jsx-runtime";

import "./blockBadge.less";
import { blockLabel } from "../model/blockUtils";

// A block's type shown as a code-font badge. The namespaced key is parsed down to a friendly name
// (see `blockLabel`). Clickable when `onClick` is given (used to select/inspect the block);
// highlighted when `selected`.
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
  const label = blockLabel(type);

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {label}
      </button>
    );
  }
  return <span className={className}>{label}</span>;
}
