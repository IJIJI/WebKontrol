import { type ViewType } from "../../../../src/views/types/schema";
import { type IconId } from "../icons/Icon";

// How each view type is presented in the UI. 
// Keyed by ViewType, so adding a new view type is a compile error.
export const VIEW_TYPE_META: Record<ViewType, { icon: IconId; label: string }> = {
  url: { icon: "tab", label: "Website" },
  blocks: { icon: "grid", label: "Blocks" },
};
