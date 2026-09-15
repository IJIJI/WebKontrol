import z from "zod";

import { isBlockSlot } from "../../../../../src/views/blocks/types/schema";
import { unwrap } from "../../../../../src/views/blocks/resolver";
import { blockDef } from "./registry";

export interface BlockLike {
  type: string;
  [key: string]: unknown;
}

// Where a value sits inside a block tree: object keys and array indices from the root block
// (whose own path is []). Editing rebuilds the tree immutably, so blocks are addressed by path
// rather than held by reference.
export type BlockPath = readonly (string | number)[];

// Duck-typed: any object with a string `type` is treated as a (child) block.
export function isBlock(v: unknown): v is BlockLike {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as { type?: unknown }).type === "string"
  );
}

/** Stable React key / comparison string for a path. */
export function pathKey(path: BlockPath): string {
  return path.join(".");
}

export function pathEquals(a: BlockPath, b: BlockPath): boolean {
  return a.length === b.length && a.every((seg, i) => seg === b[i]);
}

/** The value at `path`, or undefined if any step is missing. */
export function getAtPath(value: unknown, path: BlockPath): unknown {
  let current = value;
  for (const segment of path) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string | number, unknown>)[segment];
  }
  return current;
}

/**
 * `value` with `next` written at `path`, cloning only the spine along the way (siblings are
 * shared by reference). Missing containers are created from the segment type.
 */
export function setAtPath(value: unknown, path: BlockPath, next: unknown): unknown {
  if (path.length === 0) return next;
  const [head, ...rest] = path;

  if (typeof head === "number") {
    const source: unknown[] = Array.isArray(value) ? value : [];
    const copy = [...source];
    copy[head] = setAtPath(copy[head], rest, next);
    return copy;
  }

  const source = (value ?? {}) as Record<string, unknown>;
  return { ...source, [head]: setAtPath(source[head], rest, next) };
}

/** `value` with the entry at `path` removed (array element spliced, object key deleted). */
export function removeAtPath(value: unknown, path: BlockPath): unknown {
  if (path.length === 0) return undefined;
  const parentPath = path.slice(0, -1);
  const last = path[path.length - 1];
  const parent = getAtPath(value, parentPath);

  if (typeof last === "number") {
    const source = Array.isArray(parent) ? parent : [];
    return setAtPath(value, parentPath, source.filter((_, i) => i !== last));
  }

  const source = (parent ?? {}) as Record<string, unknown>;
  const { [last]: _dropped, ...rest } = source;
  return setAtPath(value, parentPath, rest);
}

/**
 * The path of the nearest enclosing *block* above `path`: the longest proper prefix that resolves
 * to a block. Null when `path` is the root block itself. Path steps between two blocks (a wrapper
 * object or array index) are skipped, so this lands on real blocks only.
 */
export function parentBlockPath(root: unknown, path: BlockPath): BlockPath | null {
  for (let i = path.length - 1; i >= 0; i--) {
    const prefix = path.slice(0, i);
    if (isBlock(getAtPath(root, prefix))) return prefix;
  }
  return null;
}

// Walk a config value guided by its schema, collecting the block in every slot. Mirrors the
// shape of the resolver's resolveValue walk (slot -> collect, object -> shape keys, array ->
// elements), but collects paths instead of resolving.
function collectSlots(
  schema: z.ZodType,
  value: unknown,
  path: BlockPath,
  out: { path: BlockPath; block: BlockLike }[],
): void {
  if (value === undefined || value === null) return;

  const core = unwrap(schema);

  if (isBlockSlot(core)) {
    if (isBlock(value)) out.push({ path, block: value });
    return;
  }

  if (core instanceof z.ZodObject) {
    const shape = core.shape as Record<string, z.ZodType>;
    const source = value as Record<string, unknown>;
    for (const key of Object.keys(shape)) {
      collectSlots(shape[key], source[key], [...path, key], out);
    }
    return;
  }

  if (core instanceof z.ZodArray) {
    const element = core.element as z.ZodType;
    (value as unknown[]).forEach((item, i) => collectSlots(element, item, [...path, i], out));
  }
}

// A block's child blocks with their config paths *relative to that block*, found by walking the
// block's registered config schema over its value. An unregistered type is a leaf: without a
// schema there is nothing to walk, so stale configs render as childless nodes instead of
// crashing the tree.
export function childBlocks(block: BlockLike): { path: BlockPath; block: BlockLike }[] {
  const def = blockDef(block.type);
  if (!def) return [];
  const out: { path: BlockPath; block: BlockLike }[] = [];
  collectSlots(def.configSchema as z.ZodType, block, [], out);
  return out;
}

