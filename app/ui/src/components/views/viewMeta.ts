import { type ComponentType } from "react";
import { type ViewType } from "../../../../src/views/types/schema";
import { Icons } from "../icons/Icons";

type IconComponent = ComponentType<{ size?: number; className?: string }>;

// How each view type is presented in the UI (chips, pickers, etc.). Frontend-only presentation
// metadata — not domain data. Keyed by ViewType, so adding a new view type is a compile error
// here until it has been given a label and an icon.
export const VIEW_TYPE_META: Record<ViewType, { icon: IconComponent; label: string }> = {
  url: { icon: Icons.tab, label: "Website" },
  blocks: { icon: Icons.grid, label: "Blocks" },
};
