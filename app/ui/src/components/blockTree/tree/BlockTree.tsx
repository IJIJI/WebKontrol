import { type JSX } from "react/jsx-runtime";

import "./blockTree.less";
import { type BlockLike, type BlockPath, childBlocks, pathEquals, pathKey } from "../model/blockUtils";
import { BlockChip } from "../presentation/BlockChip";

function TreeNode({
  block,
  path,
  onSelect,
  selected,
  isUnsaved,
  invalidAt,
}: {
  block: BlockLike;
  path: BlockPath;
  onSelect?: (path: BlockPath) => void;
  selected?: BlockPath;
  isUnsaved?: (path: BlockPath, block: BlockLike) => boolean;
  invalidAt?: (path: BlockPath) => string | undefined;
}): JSX.Element {
  const children = childBlocks(block);

  return (
    <div className="treeNode">
      <div className="nodeRow">
        <BlockChip
          type={block.type}
          selected={selected !== undefined && pathEquals(path, selected)}
          onClick={onSelect ? () => onSelect(path) : undefined}
          unsaved={isUnsaved?.(path, block)}
          invalid={invalidAt?.(path)}
        />
      </div>
      {children.length > 0 && (
        <div className="children">
          {children.map((child) => {
            // childBlocks paths are relative to their parent block; absolute paths address the tree.
            const childPath = [...path, ...child.path];
            return (
              <TreeNode
                key={pathKey(child.path)}
                block={child.block}
                path={childPath}
                onSelect={onSelect}
                selected={selected}
                isUnsaved={isUnsaved}
                invalidAt={invalidAt}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// A compact block tree (blocks only) with rounded CSS guide lines. When `onSelect` is given,
// each block is clickable and the `selected` one (addressed by path) is highlighted. `isUnsaved`
// marks blocks that aren't part of the saved tree (the editor's new/replaced blocks).
export function BlockTree({
  root,
  onSelect,
  selected,
  isUnsaved,
  invalidAt,
}: {
  root: BlockLike;
  onSelect?: (path: BlockPath) => void;
  selected?: BlockPath;
  isUnsaved?: (path: BlockPath, block: BlockLike) => boolean;
  invalidAt?: (path: BlockPath) => string | undefined;
}): JSX.Element {
  return (
    <div className="blockTree">
      <TreeNode
        block={root}
        path={[]}
        onSelect={onSelect}
        selected={selected}
        isUnsaved={isUnsaved}
        invalidAt={invalidAt}
      />
    </div>
  );
}
