import { type JSX } from "react/jsx-runtime";
import { ChipPill } from "../pill/ChipPill";
import { type ViewType } from "../../../../src/views/types/schema";
import { VIEW_TYPE_META } from "./viewMeta";
import { Icon } from "../icons/Icon";

// A grey chip showing a view's type (icon + label), on the neutral ChipPill base.
export function ViewTypeChip({ type }: { type: ViewType }): JSX.Element {
  const meta = VIEW_TYPE_META[type];
  return (
    <ChipPill>
      <Icon id={meta.icon} size={13} />
      <span>{meta.label}</span>
    </ChipPill>
  );
}
