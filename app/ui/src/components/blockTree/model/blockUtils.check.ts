// Self-check for the schema-driven childBlocks walk and the path helpers the editor writes
// through. No test framework in this repo yet; run with `yarn check`.
import assert from "node:assert/strict";

import {
  ContainerBlock,
  DateTimeBlock,
  FreeFormBlock,
  GridBlock,
  TextBlock,
} from "../../../../../src/views/blocks/namespaces/webkontrol/blocks.schema";
import {
  childBlocks,
  findParent,
  findPath,
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

// findParent still walks through wrapper objects.
assert.equal(findParent(freeform, clock), freeform);
assert.equal(findParent(container, clock), null);

// findPath addresses a reference-held block, absolute from the root.
assert.deepEqual(findPath(freeform, clock), ["items", 1, "block"]);
assert.deepEqual(findPath(freeform, freeform), []);
assert.equal(findPath(container, clock), null);

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

console.log("blockUtils.check: all assertions passed");
