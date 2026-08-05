import { type JSX } from "react/jsx-runtime";

import "./blockChip.less";
import { BlockIcon } from "./BlockIcon";
import { BlockBadge } from "./BlockBadge";

// A block's icon + type badge as one unit, used in the tree and the detail pane. The badge stays
// the interactive element (it owns the clickable/selected styling); the icon rides alongside.
// `unsaved` outlines the badge: this block isn't in the saved tree and is lost when not saved.
export function BlockChip({
  type,
  onClick,
  selected,
  unsaved,
}: {
  type: string;
  onClick?: () => void;
  selected?: boolean;
  unsaved?: boolean;
}): JSX.Element {
  return (
    <span className={unsaved ? "blockChip unsaved" : "blockChip"}>
      <BlockIcon type={type} size={15} />
      <BlockBadge type={type} onClick={onClick} selected={selected} />
    </span>
  );
}
