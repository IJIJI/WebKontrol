import z from "zod";

import { isBlockSlot } from "../../../../../src/views/blocks/types/schema";
import { unwrap } from "../../../../../src/views/blocks/resolver";
import { blockDef } from "./registry";

export interface BlockLike {
  type: string;
  [key: string]: unknown;
}

// Duck-typed: any object with a string `type` is treated as a (child) block.
export function isBlock(v: unknown): v is BlockLike {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as { type?: unknown }).type === "string"
  );
}

// Walk a config value guided by its schema, collecting the block in every slot. Mirrors the
// shape of the resolver's resolveValue walk (slot -> collect, object -> shape keys, array ->
// elements), but collects paths instead of resolving. `path` grows like `items[0].block`.
function collectSlots(
  schema: z.ZodType,
  value: unknown,
  path: string,
  out: { key: string; block: BlockLike }[],
): void {
  if (value === undefined || value === null) return;

  const core = unwrap(schema);

  if (isBlockSlot(core)) {
    if (isBlock(value)) out.push({ key: path, block: value });
    return;
  }

  if (core instanceof z.ZodObject) {
    const shape = core.shape as Record<string, z.ZodType>;
    const source = value as Record<string, unknown>;
    for (const key of Object.keys(shape)) {
      collectSlots(shape[key], source[key], path === "" ? key : `${path}.${key}`, out);
    }
    return;
  }

  if (core instanceof z.ZodArray) {
    const element = core.element as z.ZodType;
    (value as unknown[]).forEach((item, i) => collectSlots(element, item, `${path}[${i}]`, out));
  }
}

// A block's child blocks with their config paths, found by walking the block's registered config
// schema over its value. An unregistered type is a leaf: without a schema there is nothing to
// walk, so stale configs render as childless nodes instead of crashing the tree.
export function childBlocks(block: BlockLike): { key: string; block: BlockLike }[] {
  const def = blockDef(block.type);
  if (!def) return [];
  const out: { key: string; block: BlockLike }[] = [];
  collectSlots(def.configSchema as z.ZodType, block, "", out);
  return out;
}

// The block whose children include `target`, searched from `root`. Null when `target` is the root
// itself or isn't found. Matches by reference, so `target` must come from `root`'s own tree.
export function findParent(root: BlockLike, target: BlockLike): BlockLike | null {
  for (const { block } of childBlocks(root)) {
    if (block === target) return root;
    const found = findParent(block, target);
    if (found !== null) return found;
  }
  return null;
}
