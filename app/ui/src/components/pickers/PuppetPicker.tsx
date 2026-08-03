import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { EntityPicker } from "./EntityPicker";
import { ModalSize } from "../modal/Modal";
import { type UiPuppetState } from "../../context/ApiStateContext";
import { Icons } from "../icons/Icons";
import { DEFAULT_ENTITY_COLOR } from "../../common/appearance";

// Pick one or more puppets, then confirm. Generic over what you do with them; Callers own the
// title/label and the action (assign a view, …). Built on the shared EntityPicker.
export function PuppetPicker({
  open,
  onClose,
  puppets,
  title = "Select puppet",
  confirmLabel = "Select",
  onConfirm,
  multiple = false,
}: {
  open: boolean;
  onClose: () => void;
  puppets: UiPuppetState[];
  title?: ReactNode;
  confirmLabel?: string;
  onConfirm: (puppetKeys: string[]) => void | Promise<void>;
  multiple?: boolean;
}): JSX.Element {
  return (
    <EntityPicker<UiPuppetState>
      open={open}
      onClose={onClose}
      title={title}
      size={puppets.length <= 4 ? ModalSize.MD : ModalSize.LG}
      confirmLabel={confirmLabel}
      items={puppets}
      getKey={(p) => p.config.id}
      empty="No puppets connected."
      onConfirm={(selected) => onConfirm(selected.map((p) => p.config.id))}
      renderCard={(p) => ({
        title: p.config.name.long,
        icon: <Icons.screen />,
        color: DEFAULT_ENTITY_COLOR, // placeholder until puppets carry their own appearance
      })}
      multiple={multiple}
    />
  );
}
