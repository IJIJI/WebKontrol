import { type JSX } from "react/jsx-runtime";

import { blockIcon } from "../model/blockMeta";

// A block type's icon, sitting to the left of its badge in the tree (and reusable in the detail
// pane / breadcrumb). Sourced from the stopgap map today, the block registry (#8) later.
export function BlockIcon({ type, size = 16 }: { type: string; size?: number }): JSX.Element {
  // Call the icon render fn directly, a looked-up value used as <Icon/> trips the
  // "component created during render" rule, and these icons are plain hook-free SVG fns.
  return blockIcon(type)({ size, className: "blockIcon" });
}
