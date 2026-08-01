import { type JSX } from "react/jsx-runtime";

import { type UiPuppetState, type UiViewState } from "../../context/ApiStateContext";
import { ConfirmModal } from "../modal/ConfirmModal";
import { PuppetPicker } from "../pickers/PuppetPicker";

// The "assign this view to a puppet" flow. Owns the view-specific messaging and the 1-vs-many
// branch: a single puppet gets a confirmation, several get the picker grid. Both call `view.assign`.
export function AssignViewModal({
  open,
  onClose,
  view,
  puppets,
}: {
  open: boolean;
  onClose: () => void;
  view?: UiViewState;
  puppets: UiPuppetState[];
}): JSX.Element | null {
  if (!view) return null;

  const viewName = (
    <b>
      <code>{view.config.name.long}</code>
    </b>
  );
  const assign = (keys: string[]): void => keys.forEach((key) => void view.assign(key));

  // Common case (most instances have a single puppet): confirm rather than pick.
  if (puppets.length === 1) {
    const puppet = puppets[0];
    return (
      <ConfirmModal
        open={open}
        onClose={onClose}
        title={<>Assign {viewName}</>}
        confirmLabel="Assign"
        onConfirm={() => assign([puppet.config.id])}
      >
        <span>
          Assign {viewName} to <b>{puppet.config.name.long}</b>?
        </span>
      </ConfirmModal>
    );
  }

  return (
    <PuppetPicker
      open={open}
      onClose={onClose}
      puppets={puppets}
      title={<>Assign {viewName}</>}
      confirmLabel="Assign"
      onConfirm={assign}
      multiple
    />
  );
}
