import { type JSX } from "react/jsx-runtime";

import { useApi, type UiPuppetState } from "../../context/ApiStateContext";
import { ViewPicker } from "../pickers/ViewPicker";

// The "assign a view to this puppet" flow: owns the puppet-specific messaging around the
// ViewPicker. Counterpart of views/AssignToViewModal (which assigns a view to puppets).
export function AssignToPuppetModal({
  open,
  onClose,
  puppet,
}: {
  open: boolean;
  onClose: () => void;
  puppet?: UiPuppetState;
}): JSX.Element | null {
  const { state } = useApi();
  if (!puppet) return null;

  const views = state ? [...state.views.values()] : [];

  return (
    <ViewPicker
      open={open}
      onClose={onClose}
      views={views}
      title={
        <span>
          Assign view to{" "}
          <b>
            <code>{puppet.config.name.long}</code>
          </b>
        </span>
      }
      confirmLabel="Assign"
      onConfirm={(viewKey) => puppet.assignView(viewKey)}
    />
  );
}
