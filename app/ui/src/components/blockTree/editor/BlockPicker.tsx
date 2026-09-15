import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { EntityPicker } from "../../pickers/EntityPicker";
import { ModalSize } from "../../modal/Modal";
import { Icon } from "../../icons/Icon";
import { Icons } from "../../icons/Icons";
import { DEFAULT_ENTITY_COLOR } from "../../../common/appearance";
import { blockTypeRegistry, blockInfo } from "../model/registry";
import { useBlockClipboard } from "../model/blockClipboard";
import { type BlockLike } from "../model/blockUtils";

// Pick a block type to put in a slot. Fed straight from the registry, so plugin-provided blocks
// appear here with their own label/icon without this component knowing about them.
//
// Paste lives here rather than as a button beside every slot: the picker is already "what goes in
// this slot", so the target is settled by the time it is offered, and one implementation covers
// single slots, arrays, freeform items and the view's root alike.
export function BlockPicker({
  open,
  onClose,
  onPick,
  onPaste,
  title = "Choose a block",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: string) => void;
  /** Omit where a pasted block has nowhere to go; the paste entry is then hidden. */
  onPaste?: (block: BlockLike) => void;
  title?: ReactNode;
}): JSX.Element {
  const blocks = blockTypeRegistry.list();
  const copied = useBlockClipboard();

  return (
    <EntityPicker
      open={open}
      onClose={onClose}
      title={title}
      size={blocks.length <= 4 ? ModalSize.MD : ModalSize.LG}
      confirmLabel="Add"
      items={blocks}
      getKey={(b) => b.key}
      empty="No block types registered."
      header={
        onPaste && copied ? (
          // Acts immediately: unlike the cards below there is nothing to choose between, and
          // naming the block means you always know what you are about to insert.
          <button
            type="button"
            className="pickerAction"
            onClick={() => {
              onPaste(copied);
              onClose();
            }}
          >
            <Icons.copy size={16} />
            <span>Paste {blockInfo(copied.type)?.label ?? copied.type}</span>
            <span className="pickerActionHint">from the clipboard</span>
          </button>
        ) : undefined
      }
      onConfirm={(selected) => {
        if (selected[0]) onPick(selected[0].key);
      }}
      renderCard={(b) => ({
        title: b.info.label,
        icon: <Icon id={b.info.icon} />,
        color: DEFAULT_ENTITY_COLOR,
        chips: b.info.description ? <span className="blockPickerHint">{b.info.description}</span> : undefined,
      })}
    />
  );
}
