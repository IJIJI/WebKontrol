import { type JSX } from "react/jsx-runtime";

import "./settings.less";
import { Icons } from "../icons/Icons";

export function RestoreButton({
  onClick,
}: {
  onClick: () => void | Promise<void>
}): JSX.Element {
  return (
    <div className="setting restore">
      <Icons.undo size={20} />
    </div>
  );
}
