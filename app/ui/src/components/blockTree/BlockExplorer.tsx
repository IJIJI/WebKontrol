import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./blockExplorer.less";
import { type BlockLike, type BlockPath, getAtPath, isBlock, parentBlockPath, pathKey } from "./model/blockUtils";
import { BlockTree } from "./tree/BlockTree";
import { BlockForm } from "./BlockForm";
import { BlockPane } from "./presentation/BlockPane";

// The block tree plus a floating detail pane: clicking a block shows its config, read-only. Same
// schema-driven form the editor uses (so fields carry their real labels), minus the writes.
export function BlockExplorer({ root }: { root: BlockLike }): JSX.Element {
  const [selectedPath, setSelectedPath] = useState<BlockPath | null>(null);
  const at = selectedPath !== null ? getAtPath(root, selectedPath) : undefined;
  const selected = isBlock(at) ? at : null;
  const path = selected && selectedPath !== null ? selectedPath : [];
  const parentPath = selected ? parentBlockPath(root, path) : null;

  return (
    <div className="blockExplorer">
      <BlockTree root={root} onSelect={setSelectedPath} selected={selectedPath ?? undefined} />

      {selected && (
        <BlockPane
          type={selected.type}
          onParent={parentPath ? () => setSelectedPath(parentPath) : undefined}
          onClose={() => setSelectedPath(null)}
        >
          {/* No setAt: inspection only. Keyed per block so folded sections don't carry over. */}
          <BlockForm key={pathKey(path)} block={selected} path={path} onOpen={setSelectedPath} />
        </BlockPane>
      )}
    </div>
  );
}
