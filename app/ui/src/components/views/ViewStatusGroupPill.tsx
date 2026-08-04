import { type JSX } from "react/jsx-runtime";
import { type UiViewState, useApi } from "../../context/ApiStateContext";
import { GroupStatusPill, type StatusItem } from "../pill/statusPill/GroupStatusPill";
import { ConnectionState } from "../../../../src/types/CommonTypes";
import { type FillStyle } from "../../common/types/variants";
import { ViewStatusPill } from "./ViewStatusPill";

export function ViewStatusGroupPill({
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

  const items: StatusItem[] = assignedPuppets.map((id) => {
    const puppet = state?.puppets.get(id);
    return {
      id,
      name: puppet?.config.name.long ?? id,
      status: puppet?.info.state ?? ConnectionState.UNKNOWN,
      to: `/puppets/${id}`,
      state: { back: { path: `/views/${view.key}`, label: view.config.name.long } },
    };
  });

  return (
    <GroupStatusPill items={items}>
      <ViewStatusPill {...props} view={view} />
    </GroupStatusPill>
  );
}
