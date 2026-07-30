import { type JSX } from "react/jsx-runtime";

import "./blockChip.less";
import { BlockIcon } from "./BlockIcon";
import { BlockBadge } from "./BlockBadge";

// A block's icon + type badge as one unit, used in the tree and the detail pane. The badge stays
// the interactive element (it owns the clickable/selected styling); the icon rides alongside.
export function BlockChip({
  type,
  onClick,
  selected,
}: {
  type: string;
  onClick?: () => void;
  selected?: boolean;
}): JSX.Element {
  return (
    <span className="blockChip">
      <BlockIcon type={type} size={15} />
      <BlockBadge type={type} onClick={onClick} selected={selected} />
    </span>
  );
}
