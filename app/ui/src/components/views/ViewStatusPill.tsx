import { type JSX } from "react/jsx-runtime";
import { type UiViewState, useApi } from "../../context/ApiStateContext";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { GroupStatusPill, type StatusItem } from "../pill/statusPill/GroupStatusPill";
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


  const items: StatusItem[] = assignedPuppets.map((id) => {
    const puppet = state?.puppets.get(id);
    return {
      id,
      name: puppet?.config.name.long ?? id,
      status: puppet?.info.state ?? ConnectionState.UNKNOWN,
    };
  });

  return (
    <GroupStatusPill items={items}>
      <StatusPill {...props} status={status} label={label} />
    </GroupStatusPill>
  );
}
