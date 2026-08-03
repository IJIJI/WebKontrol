import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { EntityPicker } from "./EntityPicker";
import { ModalSize } from "../modal/Modal";
import { type UiViewState } from "../../context/ApiStateContext";
import { Icon } from "../icons/Icon";
import { ViewTypeChip } from "../views/ViewTypeChip";
import { type ViewKey } from "../../../../src/views/types/schema";

// TODO: add search/filter once there are many views.
export function ViewPicker({
  open,
  onClose,
  views,
  title = "Select view",
  confirmLabel = "Select",
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  views: UiViewState[];
  title?: ReactNode;
  confirmLabel?: string;
  onConfirm: (viewKey: ViewKey) => void | Promise<void>;
}): JSX.Element {
  return (
    <EntityPicker<UiViewState>
      open={open}
      onClose={onClose}
      title={title}
      size={views.length <= 4 ? ModalSize.MD : ModalSize.LG}
      confirmLabel={confirmLabel}
      items={views}
      getKey={(v) => v.key}
      empty="No views created."
      onConfirm={(selected) => {
        if (selected[0]) return onConfirm(selected[0].key);
      }}
      renderCard={(v) => ({
        title: v.config.name.long,
        icon: <Icon id={v.appearance.icon} />,
        color: v.appearance.color,
        chips: <ViewTypeChip type={v.config.type} />,
      })}
    />
  );
}
