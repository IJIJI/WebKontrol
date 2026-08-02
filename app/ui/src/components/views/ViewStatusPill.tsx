import { type JSX } from "react/jsx-runtime";
import { type UiViewState, useApi } from "../../context/ApiStateContext";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { ConnectionState } from "../../../../src/types/CommonTypes";
import { type FillStyle } from "../../common/types/variants";

export function ViewStatusPill({
  view,
  ...props
}: {
  view: UiViewState;
  size?: number;
  fillStyle?: FillStyle;
  collapsed?: boolean;
}): JSX.Element {
  const { state } = useApi();

  const assignedPuppets = view.assignedPuppets;
  const status = assignedPuppets.length <= 0 ? ConnectionState.DISABLED : ConnectionState.FAILED;
  const label =
    assignedPuppets.length <= 0
      ? "Inactive"
      : assignedPuppets.length === 1
        ? state?.puppets.get(assignedPuppets[0])?.config.name.short ?? assignedPuppets[0]
        : `Active ${assignedPuppets.length}x`;

  // TODO: Implement GroupStatusPill to show which puppets are active on hover / when collapsed.
  return <StatusPill {...props} status={status} label={label} />;
}
