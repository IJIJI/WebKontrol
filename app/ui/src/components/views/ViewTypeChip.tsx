import { type JSX } from "react/jsx-runtime";
import { InfoPill, PillType } from "../pill/InfoPill";
import { type ViewType } from "../../../../src/views/types/schema";
import { VIEW_TYPE_META } from "./viewMeta";

// A grey chip showing a view's type (icon + label). Uses PillType.DEFAULT for now;
// see the TODO in InfoPill about swapping to a base typeless chip once it exists.
export function ViewTypeChip({ type }: { type: ViewType }): JSX.Element {
  const meta = VIEW_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <InfoPill type={PillType.DEFAULT}>
      <Icon size={13} />
      <span>{meta.label}</span>
    </InfoPill>
  );
}
