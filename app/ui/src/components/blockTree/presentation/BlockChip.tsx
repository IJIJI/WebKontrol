import { type JSX } from "react/jsx-runtime";

import "./blockChip.less";
import { BlockIcon } from "./BlockIcon";
import { BlockBadge } from "./BlockBadge";
import { Icons } from "../../icons/Icons";
import { classNames } from "../../../common/helpers/classNames";

// A block's icon + type badge as one unit, used in the tree and the detail pane. The badge stays
// the interactive element (it owns the clickable/selected styling); the icon rides alongside.
// `unsaved` outlines the badge: this block isn't in the saved tree and is lost when not saved.
// The markers after the badge are a list, not a choice: disabled and invalid say unrelated
// things about a block, and a block that is both must show both.
export function BlockChip({
  type,
  onClick,
  selected,
  unsaved,
  disabled,
  invalid,
}: {
  type: string;
  onClick?: () => void;
  selected?: boolean;
  unsaved?: boolean;
  /** Switched off: dimmed and marked, since it is in the config but not in the view. */
  disabled?: boolean;
  /** Config its schema rejects: marked with a warning glyph, tooltip carries the message. */
  invalid?: string;
}): JSX.Element {
  return (
    <span className={classNames("blockChip", unsaved && "unsaved", disabled && "disabled", invalid && "invalid")}>
      <BlockIcon type={type} size={15} />
      <BlockBadge type={type} onClick={onClick} selected={selected} />
      {disabled && (
        <span className="blockMarker off" role="img" aria-label="Disabled" title="Disabled: left out of the view">
          <Icons.disabled size={14} />
        </span>
      )}
      {invalid && (
        <span className="blockMarker warning" role="img" aria-label={invalid} title={invalid}>
          <Icons.warning size={14} />
        </span>
      )}
    </span>
  );
}
