import { type JSX } from "react/jsx-runtime";

import { Icon } from "../../icons/Icon";
import { blockInfo } from "../model/registry";

// A block type's icon, sitting to the left of its badge in the tree (and reusable in the detail
// pane / breadcrumb). Sourced from the registry's block info; unregistered types (and blocks
// without an icon) fall back inside <Icon>.
export function BlockIcon({ type, size = 16 }: { type: string; size?: number }): JSX.Element {
  return <Icon id={blockInfo(type)?.icon} size={size} className="blockIcon" />;
}
