import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { BlockTypeTitle } from "./BlockTypeTitle";
import { Icons } from "../../icons/Icons";

// The floating pane that shows one block beside the tree: a header (optional up-to-parent, the
// block's type, close) over a scrolling body. Shared by the read-only explorer and the editor,
// which differ only in what they put in the body.
export function BlockPane({
  type,
  onParent,
  onClose,
  actions,
  children,
}: {
  type: string;
  onParent?: () => void;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <aside className="detailPane">
      <div className="paneHead">
        <div className="paneHeadLeft">
          {onParent && (
            <button type="button" className="goParent" aria-label="Go to parent block" onClick={onParent}>
              <Icons.arrowBackward size={16} />
            </button>
          )}
          <BlockTypeTitle type={type} />
        </div>
        <div className="paneHeadRight">
          {actions}
          <button type="button" className="close" aria-label="Close" onClick={onClose}>
            <Icons.close size={16} />
          </button>
        </div>
      </div>
      <div className="paneBody">{children}</div>
    </aside>
  );
}
