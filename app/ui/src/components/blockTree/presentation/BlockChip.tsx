import { type JSX } from "react/jsx-runtime";

import "./blockChip.less";
import { BlockIcon } from "./BlockIcon";
import { BlockBadge } from "./BlockBadge";
import { Icons } from "../../icons/Icons";
import { classNames } from "../../../common/helpers/classNames";

// A block's icon + type badge as one unit, used in the tree and the detail pane. The badge stays
// the interactive element (it owns the clickable/selected styling); the icon rides alongside.
// `unsaved` outlines the badge: this block isn't in the saved tree and is lost when not saved.
export function BlockChip({
  type,
  onClick,
  selected,
  unsaved,
  invalid,
}: {
  type: string;
  onClick?: () => void;
  selected?: boolean;
  unsaved?: boolean;
  /** Config its schema rejects: marked with a warning glyph, tooltip carries the message. */
  invalid?: string;
}): JSX.Element {
  return (
    <span className={classNames("blockChip", unsaved && "unsaved", invalid && "invalid")}>
      <BlockIcon type={type} size={15} />
      <BlockBadge type={type} onClick={onClick} selected={selected} />
      {invalid && (
        <span className="blockWarning" role="img" aria-label={invalid} title={invalid}>
          <Icons.warning size={14} />
        </span>
      )}
    </span>
  );
}
