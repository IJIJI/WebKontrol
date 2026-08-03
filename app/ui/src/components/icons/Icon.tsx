import { type JSX } from "react/jsx-runtime";

import { Icons } from "./Icons";

// A stable icon id. the key in the Icons map.
export type IconId = keyof typeof Icons;

// Every registered icon id for pickers.
export const ALL_ICON_IDS = Object.keys(Icons) as IconId[];

// Render an icon by id; unknown/stale ids fall back to `tile`. The resolved icon is invoked as a
// function (not <C/>) to avoid "creating a component during render".
export function Icon({
  id,
  size,
  className,
}: {
  id: string | undefined;
  size?: number;
  className?: string;
}): JSX.Element {
  const map = Icons as Record<string, (typeof Icons)[IconId]>;
  return ((id ? map[id] : undefined) ?? map.tile)({ size, className });
}
