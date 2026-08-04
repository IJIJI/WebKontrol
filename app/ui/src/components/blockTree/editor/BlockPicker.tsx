import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { EntityPicker } from "../../pickers/EntityPicker";
import { ModalSize } from "../../modal/Modal";
import { Icon } from "../../icons/Icon";
import { DEFAULT_ENTITY_COLOR } from "../../../common/appearance";
import { blockTypeRegistry } from "../model/registry";

// Pick a block type to put in a slot. Fed straight from the registry, so plugin-provided blocks
// appear here with their own label/icon without this component knowing about them.
export function BlockPicker({
  open,
  onClose,
  onPick,
  title = "Choose a block",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: string) => void;
  title?: ReactNode;
}): JSX.Element {
  const blocks = blockTypeRegistry.list();

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
