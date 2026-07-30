import { Icons } from "../../icons/Icons";
import { blockTypeParts } from "./blockUtils";

type BlockIconComp = (typeof Icons)[keyof typeof Icons];

// Stopgap block-type → icon map, keyed by the block's short name. Superseded by the block registry
// (#8), where each block package will supply its own icon; types without an entry fall back to a
// generic icon.
// TODO: needs dedicated icons for text (typography), datetime (clock) and freeform; container
// borrows selectWindow and website/fallback borrow tab for now.
export const BLOCK_TYPE_META: Record<string, { icon: BlockIconComp }> = {
  website: { icon: Icons.globe },
  text: { icon: Icons.textFields },
  container: { icon: Icons.borderOuter },
  grid: { icon: Icons.grid },
  freeform: { icon: Icons.selectWindow },
  datetime: { icon: Icons.schedule }
};

const FALLBACK_ICON: BlockIconComp = Icons.tile;

// The icon for a block type, parsed from its namespaced key.
export function blockIcon(type: string): BlockIconComp {
  return BLOCK_TYPE_META[blockTypeParts(type).name]?.icon ?? FALLBACK_ICON;
}
