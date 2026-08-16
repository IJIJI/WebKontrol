import { childBlocks, pathKey, type BlockLike, type BlockPath } from "./blockUtils";
import { blockDef } from "./registry";
import { isDisabledBlock } from "../../../../../src/views/blocks/resolver";

/** One field of one block that its schema rejects. */
export interface BlockIssue {
  /** Field path within the block, e.g. `url` or `style.fontSize`. Empty = the block itself. */
  field: string;
  message: string;
}

/** Every block's issues, keyed by `pathKey(blockPath)`. Empty map = the tree is savable. */
export type BlockIssues = Map<string, BlockIssue[]>;

/**
 * Validate every block in a tree against its registered config schema. The view schema only
 * checks that `root` is a block-shaped envelope, so without this a block missing a required
 * field saves fine and then fails to render in the served view.
 *
 * @param skipDisabled - Leave out what a disabled block takes with it (itself and its subtree),
 *   which is what the *save gate* asks for: those blocks are not in the view, so their problems
 *   cannot break it. The editor asks without it, so a parked block is still marked in the tree
 *   and its fields still show their errors. Reported either way, gating only when it renders.
 */
export function validateBlockTree(
  root: BlockLike | undefined,
  { skipDisabled = false }: { skipDisabled?: boolean } = {},
): BlockIssues {
  const issues: BlockIssues = new Map();
  if (root) walk(root, [], issues, skipDisabled);
  return issues;
}

function walk(block: BlockLike, path: BlockPath, out: BlockIssues, skipDisabled: boolean): void {
  if (skipDisabled && isDisabledBlock(block)) return; // out of the view, and so is everything below
  const children = childBlocks(block);
  const def = blockDef(block.type);

  if (!def) {
    out.set(pathKey(path), [{ field: "", message: `Unknown block type "${block.type}".` }]);
    return; // no schema, so nothing below is walkable either
  }

  const parsed = def.configSchema.safeParse(block);
  if (!parsed.success) {
    const slotPaths = children.map((c) => pathKey(c.path));
    const own = parsed.error.issues
      // Errors inside a slot belong to that child block, which gets its own entry below.
      .map((issue) => ({ field: issue.path.map(String).join("."), message: issue.message }))
      .filter(({ field }) => !slotPaths.some((s) => field === s || field.startsWith(`${s}.`)));
    if (own.length > 0) out.set(pathKey(path), own);
  }

  for (const child of children) walk(child.block, [...path, ...child.path], out, skipDisabled);
}

/** Field path -> message for one block, for the form to show inline. */
export function fieldErrors(issues: BlockIssues, blockPath: BlockPath): Map<string, string> {
  const errors = new Map<string, string>();
  for (const { field, message } of issues.get(pathKey(blockPath)) ?? []) {
    if (field) errors.set(field, message);
  }
  return errors;
}
