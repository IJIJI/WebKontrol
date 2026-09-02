import { type JSX } from "react/jsx-runtime";

import "./tagPill.less";
import { ChipPill } from "./ChipPill";
import { Icons } from "../icons/Icons";

// A tag chip: hashtag icon + name, tinted with the tag's user-chosen colour (neutral when none).
// The icon inherits the tint via currentColor.
export function TagPill({
  tag,
  color,
  size,
}: {
  tag: string;
  color?: string;
  size?: number;
}): JSX.Element {
  return (
    <ChipPill className="tagPill" color={color} size={size}>
      <Icons.hashtag size={13} />
      <span>{tag}</span>
    </ChipPill>
  );
}
