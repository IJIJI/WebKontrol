import { Icons } from "./Icons";

// A stable string id for an icon (the key in the Icons map). Stored in config/appearance and
// resolved with iconById. 
export type IconId = keyof typeof Icons;
export type IconComponent = (typeof Icons)[IconId];

const FALLBACK: IconId = "tile";

// Resolve an icon id to its component. Unknown/stale ids fall back.
export function iconById(id: string | undefined): IconComponent {
  const map = Icons as Record<string, IconComponent>;
  return (id ? map[id] : undefined) ?? map[FALLBACK];
}

// Every registered icon id, derived from the Icons map.
export const ALL_ICON_IDS = Object.keys(Icons) as IconId[];
