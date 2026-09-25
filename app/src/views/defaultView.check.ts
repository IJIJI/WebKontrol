// Self-check for the seeded default view: it is authored by hand, so it must parse as a view
// and resolve as a block tree, the same two steps the store and the renderer take. A typo in a
// block key or a style field fails here instead of showing a broken screen on a fresh box.
// Run with `yarn check`.
import assert from "node:assert/strict";

import { blockTypeRegistry } from "./blocks/registry";
import { isBroken, type ResolvedNode } from "./blocks/types/model";
import { resolveBlock } from "./blocks/resolver";
import { DEFAULT_VIEW_CONFIG } from "./defaultView";
import { AnyViewConfigSchema } from "./types/schema";
import "./blocks/namespaces/webkontrol"; // registers the blocks the view uses

const parsed = AnyViewConfigSchema.parse(DEFAULT_VIEW_CONFIG);
assert.equal(parsed.type, "blocks", "the default view is a block view");
assert.equal(parsed.name.long, "Clock", "named as the admin lists it");

// The renderer's own path: every block type registered, every block config valid.
const root: ResolvedNode = resolveBlock(parsed.type === "blocks" ? parsed.root : undefined, blockTypeRegistry);
assert.equal(isBroken(root), false, isBroken(root) ? `root: ${root.message}` : "root resolves");

// Whatever a slot holds resolves too: the resolver replaces child slots in place, so a broken
// descendant would sit in the tree instead of throwing.
function assertResolved(value: unknown, path: string): void {
  if (Array.isArray(value)) return value.forEach((item, i) => assertResolved(item, `${path}[${i}]`));
  if (value === null || typeof value !== "object") return;
  if ("broken" in value) return assert.fail(`${path}: ${String((value as unknown as { message: unknown }).message)}`);
  if ("def" in value && "config" in value) return assertResolved((value as { config: unknown }).config, path);
  for (const [key, child] of Object.entries(value)) assertResolved(child, `${path}.${key}`);
}
assertResolved(root, "root");

console.log("defaultView.check: all assertions passed");
