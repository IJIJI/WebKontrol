import { type JSX } from "react/jsx-runtime";

import { EntityPicker } from "./EntityPicker";
import { ModalSize } from "../modal/Modal";
import { type UiPuppetState } from "../../context/ApiStateContext";
import { Icons } from "../icons/Icons";

// Neutral until puppets carry their own colour (EntityMeta, #6).
const PUPPET_COLOR = "#a3a0a8";

// Pick a puppet to act on. The assign-view flow on the view page. Built on the shared EntityPicker
export function PuppetPicker({
  open,
  onClose,
  puppets,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  puppets: UiPuppetState[];
  onAssign: (puppetKey: string) => void | Promise<void>;
}): JSX.Element {
  return (
    <EntityPicker<UiPuppetState>
      open={open}
      onClose={onClose}
      title="Assign to puppet"
      size={ puppets.length <= 4 ? ModalSize.MD : ModalSize.LG}
      confirmLabel="Assign"
      items={puppets}
      getKey={(p) => p.config.id}
      empty="No puppets connected."
      onConfirm={(p) => onAssign(p.config.id)}
      renderCard={(p) => ({
        title: p.config.name.long,
        icon: <Icons.screen />,
        color: PUPPET_COLOR,
      })}
    />
  );
}
