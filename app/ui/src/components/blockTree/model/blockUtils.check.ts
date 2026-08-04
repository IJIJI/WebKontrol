// Self-check for the schema-driven childBlocks walk. No test framework in this repo yet;
// run directly:  yarn tsx ui/src/components/blockTree/model/blockUtils.check.ts
import assert from "node:assert/strict";

import {
  ContainerBlock,
  DateTimeBlock,
  FreeFormBlock,
  GridBlock,
  TextBlock,
} from "../../../../../src/views/blocks/namespaces/webkontrol/blocks.schema";
import { childBlocks, findParent, type BlockLike } from "./blockUtils";

const text: BlockLike = { type: TextBlock.key, text: "hi", style: {} };
const clock: BlockLike = { type: DateTimeBlock.key, style: {} };

// Single slot (container.block).
const container: BlockLike = { type: ContainerBlock.key, block: text, style: {} };
assert.deepEqual(
  childBlocks(container).map((c) => c.key),
  ["block"],
);
assert.equal(childBlocks(container)[0].block, text);

// Slot array (grid.blocks).
const grid: BlockLike = { type: GridBlock.key, blocks: [text, clock] };
assert.deepEqual(
  childBlocks(grid).map((c) => c.key),
  ["blocks[0]", "blocks[1]"],
);

// Slots inside wrapper objects (freeform.items[].block) — the case a naive walk misses.
const freeform: BlockLike = {
  type: FreeFormBlock.key,
  items: [
    { block: text, position: { x: 0, y: 0 }, size: { x: 10, y: 10 } },
    { block: clock, position: { x: 50, y: 0 }, size: { x: 10, y: 10 } },
  ],
};
assert.deepEqual(
  childBlocks(freeform).map((c) => c.key),
  ["items[0].block", "items[1].block"],
);
assert.equal(childBlocks(freeform)[1].block, clock);

// Leaf blocks have no children; unregistered types are leaves too (no schema to walk).
assert.deepEqual(childBlocks(text), []);
assert.deepEqual(childBlocks({ type: "acme::block::unknown", block: text }), []);

// findParent still walks through wrapper objects.
assert.equal(findParent(freeform, clock), freeform);
assert.equal(findParent(container, clock), null);

console.log("blockUtils.check: all assertions passed");
