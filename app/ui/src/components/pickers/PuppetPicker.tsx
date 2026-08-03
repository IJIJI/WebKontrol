import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { EntityPicker } from "./EntityPicker";
import { ModalSize } from "../modal/Modal";
import { type UiPuppetState } from "../../context/ApiStateContext";
import { Icon } from "../icons/Icon";
import { resolvePuppetAppearance } from "../../common/appearance";

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
      size={puppets.length <= 4 ? ModalSize.MD : ModalSize.LG} // TODO: Move to entitypicker?
      confirmLabel={confirmLabel}
      items={puppets}
      getKey={(p) => p.config.id}
      empty="No puppets connected."
      onConfirm={(selected) => onConfirm(selected.map((p) => p.config.id))}
      renderCard={(p) => {
        const appearance = resolvePuppetAppearance(p.appearance);
        return {
          title: p.config.name.long,
          icon: <Icon id={appearance.icon} />,
          color: appearance.color,
        };
      }}
      multiple={multiple}
    />
  );
}
