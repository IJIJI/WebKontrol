import { type JSX } from "react/jsx-runtime";

import { ChipPill } from "../pill/ChipPill";
import { Icon } from "../icons/Icon";
import { type UiViewState } from "../../context/ApiStateContext";

// A view as a chip: its icon + name, tinted with its appearance colour.
// Used where a view is referenced from another entity (e.g. a puppet's assigned view).
export function ViewChip({ view, size }: { view: UiViewState; size?: number }): JSX.Element {
  return (
    <ChipPill color={view.appearance.color} size={size}>
      <Icon id={view.appearance.icon} size={13} />
      <span>{view.config.name.long}</span>
    </ChipPill>
  );
}
