import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./blockExplorer.less";
import {
  type BlockLike,
  type BlockPath,
  findPath,
  getAtPath,
  isBlock,
  parentBlockPath,
} from "./model/blockUtils";
import { BlockTree } from "./tree/BlockTree";
import { BlockDetail } from "./detail/BlockDetail";
import { BlockPane } from "./presentation/BlockPane";

// The block tree plus a floating detail pane. Clicking a block (in the tree or the pane) inspects
// its full config; the pane floats over the right of the tree and scrolls independently.
export function BlockExplorer({ root }: { root: BlockLike }): JSX.Element {
  const [selectedPath, setSelectedPath] = useState<BlockPath | null>(null);
  const at = selectedPath ? getAtPath(root, selectedPath) : undefined;
  const selected = isBlock(at) ? at : null;
  const parentPath = selectedPath && selected ? parentBlockPath(root, selectedPath) : null;

  // The detail pane hands back block objects; map them onto paths for selection.
  const selectBlock = (block: BlockLike): void => {
    const path = findPath(root, block);
    if (path !== null) setSelectedPath(path);
  };

  return (
    <div className="blockExplorer">
      <BlockTree root={root} onSelect={setSelectedPath} selected={selectedPath ?? undefined} />

      {selected && (
        <BlockPane
          type={selected.type}
          onParent={parentPath ? () => setSelectedPath(parentPath) : undefined}
          onClose={() => setSelectedPath(null)}
        >
          <BlockDetail block={selected} onSelect={selectBlock} />
        </BlockPane>
      )}
    </div>
  );
}
