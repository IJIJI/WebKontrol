import { type JSX } from "react/jsx-runtime";

import "./blockTree.less";

export interface BlockLike {
  type: string;
  [key: string]: unknown;
}

// Duck-typed: any object with a string `type` is treated as a (child) block.
function isBlock(v: unknown): v is BlockLike {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as { type?: unknown }).type === "string"
  );
}

// A block's child blocks live in its slot fields (single block or an array of them). Scalar
// config fields are skipped, this is a blocks-only tree.
function childBlocks(block: BlockLike): { key: string; block: BlockLike }[] {
  const out: { key: string; block: BlockLike }[] = [];
  for (const [key, value] of Object.entries(block)) {
    if (key === "type") continue;
    if (isBlock(value)) {
      out.push({ key, block: value });
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (isBlock(item)) out.push({ key: `${key}[${i}]`, block: item });
      });
    }
  }
  return out;
}

function TreeNode({
  block,
  prefix,
  isLast,
  isRoot,
}: {
  block: BlockLike;
  prefix: string;
  isLast: boolean;
  isRoot: boolean;
}): JSX.Element {
  const children = childBlocks(block);
  const connector = isRoot ? "" : isLast ? "└─ " : "├─ ";
  const childPrefix = isRoot ? "" : prefix + (isLast ? "   " : "│  ");

  return (
    <>
      <div className="treeRow">
        <span className="lines">{prefix + connector}</span>
        <span className="blockType">{block.type}</span>
      </div>
      {children.map((child, i) => (
        <TreeNode
          key={child.key}
          block={child.block}
          prefix={childPrefix}
          isLast={i === children.length - 1}
          isRoot={false}
        />
      ))}
    </>
  );
}

// A compact, Linux-`tree`-style view of a block and its slot children (blocks only).
export function BlockTree({ root }: { root: BlockLike }): JSX.Element {
  return (
    <div className="blockTree">
      <TreeNode block={root} prefix="" isLast isRoot />
    </div>
  );
}
