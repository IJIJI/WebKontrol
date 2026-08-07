// Self-check for the block model: the schema-driven childBlocks walk, the path helpers the
// editor writes through, and the per-block tree validation. No test framework in this repo yet;
// run with `yarn check`.
import assert from "node:assert/strict";

import {
  ContainerBlock,
  DateTimeBlock,
  DividerBlock,
  FreeFormBlock,
  GridBlock,
  SpacerBlock,
  StackBlock,
  TextBlock,
  WebsiteBlock,
  ns,
  WEBKONTROL_BLOCKS,
} from "../../../../../src/views/blocks/namespaces/webkontrol/blocks.schema";
import { BlockTypeRegistry } from "../../../../../src/views/blocks/registry";
import { resolveBlock } from "../../../../../src/views/blocks/resolver";
import { formatPhpDate } from "../../../../../src/views/blocks/phpDate";
import { placementStyles, textStyles } from "../../../../../src/views/blocks/styles";
import { blockStyleSchema, GridConfigSchema, type BlockStyle } from "../../../../../src/views/blocks/types/schema";
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

//* style mappers: units are applied in one place, unset fields skip (and so inherit)

{
  const hugStyle = blockStyleSchema("content");
  const css = textStyles(hugStyle.parse({ fontSize: 100, letterSpacing: 2, lineHeight: 1.2, opacity: 0.5 }) as BlockStyle);
  assert.equal(css.fontSize, "100px", "set font size, in px");
  assert.equal(css.letterSpacing, "2px");
  assert.equal(css.lineHeight, 1.2, "line height stays unitless");
  assert.equal(css.opacity, 0.5);

  const empty = textStyles(hugStyle.parse({}) as BlockStyle);
  assert.equal(empty.fontSize, undefined, "unset font size emits nothing and inherits (page default in view.css)");
  assert.equal(empty.letterSpacing, undefined, "unset fields stay undefined so styleMap skips them");
  assert.equal(empty.overflow, undefined, "the overflow default lives in the stylesheet, not the config");
  assert.equal(empty.textAlign, "center", "the one alignment drives text-align");
  assert.equal(empty.justifyContent, "center", "vertical middle distributes a stretched chip");

  assert.equal((hugStyle.parse({}) as BlockStyle).sizing, "content", "text chips hug by default");
  assert.deepEqual(
    placementStyles((hugStyle.parse({}) as BlockStyle).alignment),
    { justifyContent: "center", alignItems: "center" },
    "default placement centers the chip",
  );
  assert.deepEqual(
    placementStyles({ horizontal: "right", vertical: "bottom" }),
    { justifyContent: "flex-end", alignItems: "flex-end" },
  );
  assert.deepEqual(placementStyles(undefined), {}, "fill-only blocks have no alignment to place");
}

//* injected style: every block is styleable; sizing only exists where hugging works

{
  // Old saved configs keep their exact meaning through the injection.
  const oldText = TextBlock.configSchema.parse({
    type: TextBlock.key, text: "hi",
    style: { fontSize: 100, sizing: "container", alignment: { horizontal: "left" }, background: "#000" },
  }) as { style: BlockStyle };
  assert.equal(oldText.style.fontSize, 100);
  assert.equal(oldText.style.sizing, "container");
  assert.equal(oldText.style.alignment?.horizontal, "left");
  assert.equal(oldText.style.background, "#000");

  // Fill-only blocks: style exists (injected), sizing/alignment do not.
  const site = WebsiteBlock.configSchema.parse({ type: WebsiteBlock.key, url: "https://example.com" }) as { style: BlockStyle };
  assert.notEqual(site.style, undefined, "every block gets a style");
  assert.equal("sizing" in site.style, false, "fill-only blocks have no sizing field");

  // A previously style-less block accepts styling now.
  const styledGrid = GridBlock.configSchema.safeParse({ type: GridBlock.key, style: { background: "#123" } });
  assert.equal(styledGrid.success, true);
}

//* stack: a bare stack is a valid empty row that stretches its children

{
  const stack = StackBlock.configSchema.parse({ type: StackBlock.key }) as Record<string, unknown>;
  assert.equal(stack.direction, "row");
  assert.equal(stack.justify, "start");
  assert.equal(stack.align, "stretch");
  assert.deepEqual(stack.blocks, []);
  // Slot discovery must see stack children like grid children.
  const withChild = { type: StackBlock.key, blocks: [{ type: TextBlock.key }] };
  assert.deepEqual(childBlocks(withChild).map((c) => pathKey(c.path)), ["blocks.0"]);
}

//* content blocks: divider defaults, spacer parses bare

{
  const divider = DividerBlock.configSchema.parse({ type: DividerBlock.key }) as Record<string, unknown>;
  assert.equal(divider.direction, "horizontal");
  assert.equal(divider.thickness, 2);
  assert.equal(divider.color, undefined, "line color default lives in the stylesheet");
  assert.equal(SpacerBlock.configSchema.safeParse({ type: SpacerBlock.key }).success, true);
}

//* website block: scale-to-fit and hidden scrollbar are the defaults

{
  const parsed = WebsiteBlock.configSchema.parse({ type: WebsiteBlock.key, url: "https://example.com" }) as Record<string, unknown>;
  assert.equal(parsed.scaling, "fit");
  assert.equal(parsed.scrollbar, "hidden");
}

//* freeform items: alignment anchors default top-left so existing views stay identical

{
  const parsed = FreeFormBlock.configSchema.parse({
    type: FreeFormBlock.key,
    items: [{ block: { type: TextBlock.key } }],
  }) as { items: { alignment: unknown; rotation?: unknown }[] };
  assert.deepEqual(parsed.items[0].alignment, { horizontal: "left", vertical: "top" });
  assert.equal(parsed.items[0].rotation, undefined);
}

//* grid layout: track templates are validated token lists, counts are capped

{
  const layout = { rows: 2, columns: 2 };
  assert.equal(GridConfigSchema.safeParse({ ...layout, templateColumns: "1fr 2.5fr auto 100px 30%" }).success, true);
  assert.equal(GridConfigSchema.safeParse({ ...layout, templateColumns: "minmax(0, 1fr)" }).success, false, "only fr/%/px/auto tokens");
  assert.equal(GridConfigSchema.safeParse({ ...layout, templateRows: "" }).success, false, "empty template is invalid, omit instead");
  assert.equal(GridConfigSchema.safeParse({ rows: 200, columns: 2 }).success, false, "counts are capped");
}

//* formatPhpDate: the datetime block's formatter

{
  const monday = new Date(2026, 0, 5, 14, 7, 9); // Mon 5 Jan 2026, 14:07:09 local
  assert.equal(formatPhpDate("H:i:s", monday), "14:07:09");
  assert.equal(formatPhpDate("D j M Y", monday), "Mon 5 Jan 2026");
  assert.equal(formatPhpDate("l, jS F", monday), "Monday, 5th January");
  assert.equal(formatPhpDate("g:i A", monday), "2:07 PM");
  assert.equal(formatPhpDate("\\Y = Y", monday), "Y = 2026", "backslash escapes a literal");

  const sunday = new Date(2026, 0, 4, 0, 30, 0);
  assert.equal(formatPhpDate("N w", sunday), "7 0", "ISO vs plain weekday numbering");
  assert.equal(formatPhpDate("g G h a", sunday), "12 0 12 am", "12h/24h midnight");
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
