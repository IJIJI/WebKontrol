// Self-check for the block model: the schema-driven childBlocks walk, the path helpers the
// editor writes through, and the per-block tree validation. No test framework in this repo yet;
// run with `yarn check`.
import assert from "node:assert/strict";

import {
  ContainerBlock,
  DateTimeBlock,
  FreeFormBlock,
  GridBlock,
  TextBlock,
  WebsiteBlock,
  ns,
  WEBKONTROL_BLOCKS,
} from "../../../../../src/views/blocks/namespaces/webkontrol/blocks.schema";
import { BlockTypeRegistry } from "../../../../../src/views/blocks/registry";
import { resolveBlock } from "../../../../../src/views/blocks/resolver";
import { isBroken, type ResolvedNode } from "../../../../../src/views/blocks/types/model";
import { arrayMove } from "../../../common/helpers/arrayMove";
import { fieldErrors, validateBlockTree } from "./validate";
import {
  childBlocks,
  getAtPath,
  parentBlockPath,
  pathKey,
  removeAtPath,
  setAtPath,
  type BlockLike,
} from "./blockUtils";

const text: BlockLike = { type: TextBlock.key, text: "hi", style: {} };
const clock: BlockLike = { type: DateTimeBlock.key, style: {} };

//* childBlocks: slot discovery + relative paths

// Single slot (container.block).
const container: BlockLike = { type: ContainerBlock.key, block: text, style: {} };
assert.deepEqual(childBlocks(container).map((c) => pathKey(c.path)), ["block"]);
assert.equal(childBlocks(container)[0].block, text);

// Slot array (grid.blocks).
const grid: BlockLike = { type: GridBlock.key, blocks: [text, clock] };
assert.deepEqual(childBlocks(grid).map((c) => pathKey(c.path)), ["blocks.0", "blocks.1"]);

// Slots inside wrapper objects (freeform.items[].block) — the case a naive walk misses.
const freeform: BlockLike = {
  type: FreeFormBlock.key,
  items: [
    { block: text, position: { x: 0, y: 0 }, size: { x: 10, y: 10 } },
    { block: clock, position: { x: 50, y: 0 }, size: { x: 10, y: 10 } },
  ],
};
assert.deepEqual(childBlocks(freeform).map((c) => pathKey(c.path)), ["items.0.block", "items.1.block"]);
assert.equal(childBlocks(freeform)[1].block, clock);

// Leaf blocks have no children; unregistered types are leaves too (no schema to walk).
assert.deepEqual(childBlocks(text), []);
assert.deepEqual(childBlocks({ type: "acme::block::unknown", block: text }), []);

//* Path helpers

assert.equal(getAtPath(freeform, ["items", 0, "block"]), text);
assert.equal(getAtPath(freeform, ["items", 9, "block"]), undefined);
assert.equal(getAtPath(freeform, []), freeform);

// setAtPath writes immutably and shares untouched siblings.
const edited = setAtPath(freeform, ["items", 0, "block", "text"], "bye") as typeof freeform;
assert.equal(getAtPath(edited, ["items", 0, "block", "text"]), "bye");
assert.equal(getAtPath(freeform, ["items", 0, "block", "text"]), "hi", "source not mutated");
assert.equal(
  getAtPath(edited, ["items", 1]),
  getAtPath(freeform, ["items", 1]),
  "untouched sibling shared by reference",
);

// setAtPath creates missing containers from the segment type.
const seeded = setAtPath({ type: ContainerBlock.key }, ["block"], text);
assert.equal(getAtPath(seeded, ["block"]), text);

// removeAtPath splices arrays and deletes object keys.
const spliced = removeAtPath(grid, ["blocks", 0]) as BlockLike;
assert.deepEqual((spliced.blocks as BlockLike[]).map((b) => b.type), [DateTimeBlock.key]);
const cleared = removeAtPath(container, ["block"]) as Record<string, unknown>;
assert.equal("block" in cleared, false);

// parentBlockPath skips wrapper/index steps and lands on the enclosing block.
assert.deepEqual(parentBlockPath(freeform, ["items", 0, "block"]), []);
assert.equal(parentBlockPath(freeform, []), null, "root has no parent block");
// container.block is a text block; a field inside it resolves to that block, not the container.
assert.deepEqual(parentBlockPath(container, ["block", "text"]), ["block"]);

//* validateBlockTree: per-block schema errors, keyed by block path

// A complete tree is savable.
const goodSite: BlockLike = { type: WebsiteBlock.key, url: "https://example.com" };
assert.equal(validateBlockTree({ type: GridBlock.key, blocks: [goodSite] }).size, 0);

// A missing required field is reported against its own block, by field name.
const badSite: BlockLike = { type: WebsiteBlock.key };
const nested = validateBlockTree({ type: ContainerBlock.key, block: badSite });
assert.deepEqual([...nested.keys()], ["block"], "issue keyed by the child's path");
assert.equal(nested.get("block")?.[0].field, "url");

// The parent is clean: a slot only sees the loose envelope, so a child's problems aren't its own.
assert.equal(nested.has(""), false);

// Unregistered types report once and stop (no schema to walk below them).
const foreign = validateBlockTree({ type: "acme::block::nope", block: badSite });
assert.deepEqual([...foreign.keys()], [""]);

// fieldErrors flattens one block's issues for the form.
assert.equal(fieldErrors(nested, ["block"]).get("url") !== undefined, true);
assert.equal(fieldErrors(nested, []).size, 0);

//* resolveBlock: bad content becomes a BrokenBlock node, never a throw

{
  const registry = new BlockTypeRegistry();
  ns.register(registry, WEBKONTROL_BLOCKS);

  const good = resolveBlock({ type: ContainerBlock.key, block: goodSite, style: {} }, registry);
  assert.equal(isBroken(good), false, "valid tree resolves");

  const unknown = resolveBlock({ type: "acme::block::nope" }, registry);
  assert.equal(isBroken(unknown), true, "unknown type is broken, not thrown");

  const invalid = resolveBlock(badSite, registry);
  assert.equal(isBroken(invalid) && invalid.message.includes("url"), true, "message names the field");

  // A broken child stays local: the parent resolves, the child slot holds the broken node.
  const withBadChild = resolveBlock({ type: ContainerBlock.key, block: badSite, style: {} }, registry);
  assert.equal(isBroken(withBadChild), false, "parent is not broken by its child");
  if (!isBroken(withBadChild)) {
    const child = (withBadChild.config as { block: unknown }).block;
    assert.equal(isBroken(child as ResolvedNode), true, "child slot holds the broken node");
    assert.deepEqual(withBadChild.dependencies, [], "broken child contributes no dependencies");
  }
}

//* arrayMove: the slot-list reorder primitive

assert.deepEqual(arrayMove(["a", "b", "c"], 0, 1), ["b", "a", "c"]);
assert.deepEqual(arrayMove(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
assert.deepEqual(arrayMove(["a", "b"], 0, 9), ["a", "b"], "out of range is a no-op");
// The slot list moves a block to its neighbouring *entry's* index, so junk between blocks still
// yields one visible step: down lands after the target, up lands before it.
assert.deepEqual(arrayMove(["a", "junk", "b"], 0, 2), ["junk", "b", "a"], "down past junk");
assert.deepEqual(arrayMove(["a", "junk", "b"], 2, 0), ["b", "a", "junk"], "up past junk");

console.log("blockUtils.check: all assertions passed");
