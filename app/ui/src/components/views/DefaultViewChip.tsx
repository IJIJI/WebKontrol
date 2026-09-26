import { type JSX } from "react/jsx-runtime";

import { ChipPill } from "../pill/ChipPill";
import { Icons } from "../icons/Icons";

// Marks the default view: on the view itself, and beside a puppet's view chip when the puppet
// shows it because it has no view of its own (so there is nothing to unassign there). Neutral,
// untinted: it qualifies the chip next to it rather than competing with it.
export function DefaultViewChip({ size }: { size?: number }): JSX.Element {
  return (
    <ChipPill size={size}>
      <Icons.home size={13} />
      <span>Default</span>
    </ChipPill>
  );
}
