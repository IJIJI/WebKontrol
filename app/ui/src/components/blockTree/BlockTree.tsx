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

// Nested rows; the connector guides are drawn in CSS (border-based), so last-child detection
// is handled by :last-child rather than prefix strings.
function TreeNode({ block }: { block: BlockLike }): JSX.Element {
  const children = childBlocks(block);

  return (
    <div className="treeNode">
      <div className="nodeRow">
        <span className="blockType">{block.type}</span>
      </div>
      {children.length > 0 && (
        <div className="children">
          {children.map((child) => (
            <TreeNode key={child.key} block={child.block} />
          ))}
        </div>
      )}
    </div>
  );
}

// A compact block tree (blocks only) with rounded CSS guide lines.
export function BlockTree({ root }: { root: BlockLike }): JSX.Element {
  return (
    <div className="blockTree">
      <TreeNode block={root} />
    </div>
  );
}
