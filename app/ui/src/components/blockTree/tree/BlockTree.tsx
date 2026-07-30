import { type JSX } from "react/jsx-runtime";

import "./blockTree.less";
import { type BlockLike, childBlocks } from "../model/blockUtils";
import { BlockChip } from "../presentation/BlockChip";

function TreeNode({
  block,
  onSelect,
  selected,
}: {
  block: BlockLike;
  onSelect?: (block: BlockLike) => void;
  selected?: BlockLike;
}): JSX.Element {
  const children = childBlocks(block);

  return (
    <div className="treeNode">
      <div className="nodeRow">
        <BlockChip
          type={block.type}
          selected={block === selected}
          onClick={onSelect ? () => onSelect(block) : undefined}
        />
      </div>
      {children.length > 0 && (
        <div className="children">
          {children.map((child) => (
            <TreeNode key={child.key} block={child.block} onSelect={onSelect} selected={selected} />
          ))}
        </div>
      )}
    </div>
  );
}

// A compact block tree (blocks only) with rounded CSS guide lines. When `onSelect` is given,
// each block is clickable and the `selected` one is highlighted.
export function BlockTree({
  root,
  onSelect,
  selected,
}: {
  root: BlockLike;
  onSelect?: (block: BlockLike) => void;
  selected?: BlockLike;
}): JSX.Element {
  return (
    <div className="blockTree">
      <TreeNode block={root} onSelect={onSelect} selected={selected} />
    </div>
  );
}
