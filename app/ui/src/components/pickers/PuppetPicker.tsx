import { type JSX } from "react/jsx-runtime";

import { EntityPicker } from "./EntityPicker";
import { Modal, ModalSize } from "../modal/Modal";
import { UiViewState, type UiPuppetState } from "../../context/ApiStateContext";
import { Icons } from "../icons/Icons";
import { Button } from "../button/Button";
import { FillStyle, Variant } from "../../helpers/variants";

// Neutral until puppets carry their own colour (EntityMeta, #6).
const PUPPET_COLOR = "#a3a0a8";

// Pick a puppet to act on. The assign-view flow on the view page. Built on the shared EntityPicker
export function PuppetPicker({
  open,
  onClose,
  puppets,
  view,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  puppets: UiPuppetState[];
  view?: UiViewState;
  onAssign: (puppetKey: string) => void | Promise<void>;
}): JSX.Element {
  // TODO: Better style the view name.
  if (puppets.length == 1) // TODO: This should not be part of the puppet picker, it is view-specific. Check how to make the split.
    return (
      <Modal 
        open={open}
        onClose={onClose}
        title={<span>Assign {view ? <b><code>{view?.config.name.long}</code></b> : "view"}</span>}
        size={ ModalSize.SM }
        footer={
          <>
            <Button fillStyle={FillStyle.SKELETON} onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={Variant.ACCENT}
              onClick={() => {
                void onAssign(puppets[0].config.id);
                onClose();
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <span>Are you sure you want to assign the <b><code>{view?.config.name.long}</code></b> view?</span>
      </Modal>
  );

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
