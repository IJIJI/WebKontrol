import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./blockExplorer.less";
import { type BlockLike } from "./model/blockUtils";
import { BlockTree } from "./tree/BlockTree";
import { BlockDetail } from "./detail/BlockDetail";
import { BlockTypeTitle } from "./presentation/BlockTypeTitle";
import { Icons } from "../icons/Icons";

// The block tree plus a floating detail pane. Clicking a block (in the tree or the pane) inspects
// its full config; the pane floats over the right of the tree and scrolls independently.
export function BlockExplorer({ root }: { root: BlockLike }): JSX.Element {
  const [selected, setSelected] = useState<BlockLike | null>(null);

  return (
    <div className="blockExplorer">
      <BlockTree root={root} onSelect={setSelected} selected={selected ?? undefined} />

      {selected && (
        <aside className="detailPane">
          <div className="paneHead">
            <BlockTypeTitle type={selected.type} />
            <button type="button" className="close" aria-label="Close" onClick={() => setSelected(null)}>
              <Icons.close size={16} />
            </button>
          </div>
          <div className="paneBody">
            <BlockDetail block={selected} onSelect={setSelected} />
          </div>
        </aside>
      )}
    </div>
  );
}
