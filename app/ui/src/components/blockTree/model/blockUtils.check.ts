// Self-check for the block model: the schema-driven childBlocks walk, the path helpers the
// editor writes through, and the per-block tree validation. No test framework in this repo yet;
// run with `yarn check`.
import assert from "node:assert/strict";
import z from "zod";

import { describeField } from "../../settings/zodField";
import { boxMode, formatBox, parseBox, slotCount, slotTargets, type BoxValue } from "../../settings/implementations/cssBox";
import { formatHexAlpha, parseHexAlpha } from "../../settings/implementations/cssColor";
import { formatTracks, parseTracks, type Track } from "../../settings/implementations/cssTracks";
import { formatSize, parseSize } from "../../settings/implementations/cssSize";

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
import { blockStyles, slotStyles, textBoxStyles } from "../../../../../src/views/blocks/styles";
import { BackgroundStyleShape, BlockStyleShape, blockStyleSchema, GridConfigSchema, type BlockStyle } from "../../../../../src/views/blocks/types/schema";
import type { FieldMeta } from "../../../../../src/views/types/schema";
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

//* cssColor: hex + alpha must round-trip, and leave non-hex colours alone

{
  assert.deepEqual(parseHexAlpha("#ff0000"), { rgb: "#ff0000", alpha: 1 });
  assert.deepEqual(parseHexAlpha("#F00"), { rgb: "#ff0000", alpha: 1 }, "shorthand expands, case folds");
  assert.deepEqual(parseHexAlpha("#ff000080"), { rgb: "#ff0000", alpha: 0.5 });
  assert.deepEqual(parseHexAlpha("#f008"), { rgb: "#ff0000", alpha: 0.53 }, "four-digit shorthand");

  // Anything without an alpha channel to drive: the slider stays hidden rather than guessing.
  assert.equal(parseHexAlpha("red"), null);
  assert.equal(parseHexAlpha("rgb(255 0 0)"), null);
  assert.equal(parseHexAlpha("linear-gradient(red, blue)"), null);
  assert.equal(parseHexAlpha(undefined), null);
  assert.equal(parseHexAlpha("#ff000"), null, "a five-digit hex is not a colour");
  assert.deepEqual(parseHexAlpha("#ff00"), { rgb: "#ffff00", alpha: 0 }, "but four digits is #rgba");

  // Opaque keeps the plain form, so a colour nobody made transparent is left untouched.
  assert.equal(formatHexAlpha("#ff0000", 1), "#ff0000");
  assert.equal(formatHexAlpha("#ff0000", 0.5), "#ff000080");
  assert.equal(formatHexAlpha("#ff0000", 0), "#ff000000");
  // Stable: writing a slider value and reading it back lands on the same number.
  for (const alpha of [0, 0.25, 0.33, 0.5, 0.75, 0.99]) {
    assert.equal(parseHexAlpha(formatHexAlpha("#123456", alpha))?.alpha, alpha, `alpha ${alpha} round-trips`);
  }
}

//* cssBox: the box editor must round-trip a shorthand, and refuse what it can't represent

{
  const sides = (raw: string): unknown => parseBox(raw)?.sides;
  // The CSS 1/2/3/4-value expansion, in top-right-bottom-left order.
  assert.deepEqual(sides("20px"), [20, 20, 20, 20]);
  assert.deepEqual(sides("5px 10px"), [5, 10, 5, 10]);
  assert.deepEqual(sides("1px 2px 3px"), [1, 2, 3, 2]);
  assert.deepEqual(sides("1px 2px 3px 4px"), [1, 2, 3, 4]);
  assert.equal(parseBox("5px 10px")?.unit, "px");
  assert.equal(parseBox("50%")?.unit, "%");
  assert.deepEqual(parseBox("")?.sides, [undefined, undefined, undefined, undefined], "unset parses as blank");

  // Beyond the widget: it shows the raw string rather than mangling these.
  assert.equal(parseBox("0 auto"), null, "keywords");
  assert.equal(parseBox("calc(100% - 4px)"), null, "expressions");
  assert.equal(parseBox("5px 2em"), null, "mixed units");
  assert.equal(parseBox("1 2"), null, "a non-zero length needs a unit");
  assert.equal(parseBox("1px 2px 3px 4px 5px"), null, "too many values");

  // Round trip: shortest equivalent form, and clearing unsets rather than storing "".
  const round = (raw: string): string | undefined => formatBox(parseBox(raw) as BoxValue);
  assert.equal(round("20px"), "20px");
  assert.equal(round("5px 5px"), "5px", "collapses to the shortest form");
  assert.equal(round("1px 2px 1px 2px"), "1px 2px");
  assert.equal(round("1px 2px 3px 2px"), "1px 2px 3px");
  assert.equal(round("1px 2px 3px 4px"), "1px 2px 3px 4px");
  assert.equal(round(""), undefined, "an empty box clears the field");
  assert.equal(round("0"), "0", "zero needs no unit");
  assert.equal(formatBox({ sides: [4, undefined, 4, undefined], unit: "px" }), "4px 0",
    "a blank side among set ones is a zero, since the shorthand cannot skip a position");

  // The editor's link modes are the CSS shorthand forms, so the inputs shown always match the
  // value stored: one, one per opposite pair, or one per position.
  const mode = (raw: string): string => boxMode(parseBox(raw) as BoxValue);
  assert.equal(mode("3px"), "all");
  assert.equal(mode("3px 4px"), "pair");
  assert.equal(mode("1px 2px 3px"), "each", "a three-value form still needs four inputs");
  assert.equal(mode("1px 2px 3px 4px"), "each");
  assert.deepEqual([slotCount("all"), slotCount("pair"), slotCount("each")], [1, 2, 4]);
  // Which positions each input drives. For corners the pair is diagonal, which is the same
  // arithmetic: the CSS two-value form is [a, b, a, b] either way.
  assert.deepEqual(slotTargets("all", 0), [0, 1, 2, 3]);
  assert.deepEqual(slotTargets("pair", 0), [0, 2]);
  assert.deepEqual(slotTargets("pair", 1), [1, 3]);
  assert.deepEqual(slotTargets("each", 2), [2]);
}

//* number bounds: a bounded float needs a usable step, or its arrows jump the whole range

{
  const step = (schema: unknown): number | undefined => describeField(schema).step;
  // Narrow ranges are fractions and get a fine step...
  assert.equal(step(z.number().min(0).max(1)), 0.01, "opacity steps by a hundredth, not by 1");
  assert.equal(step(z.number().min(0.5).max(3)), 0.01, "line height likewise");
  // ...wide ones are pixels or percent, and keep whole numbers.
  assert.equal(step(z.number().min(-180).max(180)), undefined, "rotation stays in whole degrees");
  assert.equal(step(z.number().min(1).max(100)), undefined, "thickness stays in whole px");
  assert.equal(step(z.number().min(0).max(100)), undefined, "coordinates stay in whole %");
  assert.equal(step(z.number().int().min(1).max(24)), 1, "an explicit int check still wins");
  assert.equal(step(z.number().multipleOf(5)), 5, "so does multipleOf");
  assert.equal(step(z.number()), undefined, "an unbounded field has nothing to derive from");
}

//* withGroup: tags a composition for the editor without disturbing the shapes it composes

{
  const meta = (field: { meta: () => unknown }): FieldMeta => field.meta() as FieldMeta;

  const background = meta(BlockStyleShape.background);
  assert.equal(background.group, "Box");
  // zod's .meta() replaces rather than merges, so the pre-existing meta must be carried over.
  assert.equal(background.label, "Background", "label survives the group tag");
  assert.equal(background.input, "color", "so do the other hints");
  assert.equal(meta(BlockStyleShape.fontSize).group, "Text");
  // The source shape is untouched: composing it elsewhere can group it differently, or not.
  assert.equal(meta(BackgroundStyleShape.background).group, undefined);
}

//* style mappers: units are applied in one place, unset fields skip (and so inherit)

{
  const hugStyle = blockStyleSchema("content");
  const css = blockStyles(hugStyle.parse({ fontSize: 100, letterSpacing: 2, lineHeight: 1.2, opacity: 0.5 }));
  assert.equal(css.fontSize, "100px", "set font size, in px");
  assert.equal(css.letterSpacing, "2px");
  assert.equal(css.lineHeight, 1.2, "line height stays unitless");
  assert.equal(css.opacity, 0.5);

  const empty = blockStyles(hugStyle.parse({}));
  assert.equal(empty.fontSize, undefined, "unset font size emits nothing and inherits (page default in view.css)");
  assert.equal(empty.letterSpacing, undefined, "unset fields stay undefined so styleMap skips them");
  assert.equal(empty.overflow, undefined, "the overflow default lives in the stylesheet, not the config");
  // The box mapper is generic: alignment never leaks into it, or a container's alignment would
  // silently re-align text in the blocks it wraps.
  assert.equal(empty.textAlign, undefined, "alignment is not a box style");
  assert.equal(empty.justifyContent, undefined, "alignment is not a box style");

  assert.equal((hugStyle.parse({}) as BlockStyle).size?.x, "content", "text chips hug by default");
  assert.equal((hugStyle.parse({}) as BlockStyle).size?.y, "content", "on both axes");

  // Slot placement, and the text-only echo of the same alignment inside the box.
  const alignment = (hugStyle.parse({}) as BlockStyle).alignment;
  assert.deepEqual(slotStyles(alignment), { justifyContent: "center", alignItems: "center" }, "default placement centers the chip");
  assert.deepEqual(textBoxStyles(alignment), { textAlign: "center", justifyContent: "center" }, "one alignment drives text layout too");
  assert.deepEqual(
    slotStyles({ horizontal: "right", vertical: "bottom" }),
    { justifyContent: "flex-end", alignItems: "flex-end" },
  );
  assert.deepEqual(slotStyles(undefined), {}, "fill-only blocks have no alignment to place");
  assert.deepEqual(textBoxStyles(undefined), {});
}

//* injected style: every block is styleable; sizing only exists where hugging works

{
  // Old saved configs keep their exact meaning through the injection.
  const oldText = TextBlock.configSchema.parse({
    type: TextBlock.key, text: "hi",
    style: { fontSize: 100, size: { x: "container" }, alignment: { horizontal: "left" }, background: "#000" },
  }) as { style: BlockStyle };
  assert.equal(oldText.style.fontSize, 100);
  assert.equal(oldText.style.size?.x, "container");
  assert.equal(oldText.style.size?.y, "content", "an unset axis still takes the block default");
  assert.equal(oldText.style.alignment?.horizontal, "left");
  assert.equal(oldText.style.background, "#000");

  // Fill-only blocks: same universal box, defaulting to container on both axes. Size is not
  // gated per block, a length is meaningful everywhere and gating would be a list to curate.
  const site = WebsiteBlock.configSchema.parse({ type: WebsiteBlock.key, url: "https://example.com" }) as { style: BlockStyle };
  assert.notEqual(site.style, undefined, "every block gets a style");
  assert.deepEqual(site.style.size, { x: "container", y: "container" }, "fill-only blocks default to container");

  // A previously style-less block accepts styling now.
  const styledGrid = GridBlock.configSchema.safeParse({ type: GridBlock.key, style: { background: "#123" } });
  assert.equal(styledGrid.success, true);

  // A realistic saved tree (the shapes a real view nests) still resolves end to end.
  const registry = new BlockTypeRegistry();
  ns.register(registry, WEBKONTROL_BLOCKS);
  const tree = resolveBlock({
    type: GridBlock.key,
    layout: { rows: 2, columns: 2 },
    blocks: [
      { type: ContainerBlock.key, style: { padding: "20px", background: "#0ea5b7" }, block: { type: WebsiteBlock.key, url: "https://example.com" } },
      { type: FreeFormBlock.key, items: [{ position: { x: 25, y: 25 }, size: { x: 50, y: 50 }, block: { type: TextBlock.key, text: "hi", style: { fontSize: 100 } } }] },
      { type: StackBlock.key, blocks: [{ type: DateTimeBlock.key }, { type: SpacerBlock.key, size: 20 }] },
    ],
  }, registry);
  assert.equal(isBroken(tree), false, "a realistic nested tree resolves");
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
  // Both CSS values default in the stylesheet, not the config, so user CSS can retheme them.
  assert.equal(divider.thickness, undefined);
  assert.equal(divider.color, undefined);
  assert.equal(SpacerBlock.configSchema.safeParse({ type: SpacerBlock.key }).success, true);
}

//* text is trimmed: pre-line makes newlines significant, so stray edges must not survive

{
  const text = (raw: string): string =>
    (TextBlock.configSchema.parse({ type: TextBlock.key, text: raw }) as { text: string }).text;
  assert.equal(text("Test 1\n"), "Test 1", "a trailing return from the textarea is dropped");
  assert.equal(text("\n  Test 1  \n\n"), "Test 1", "both edges, spaces and returns alike");
  assert.equal(text("Line 1\n\nLine 2"), "Line 1\n\nLine 2", "interior blank lines are preserved");
}

//* freeform item size: per-axis optional, so an item can fit its block

{
  const parse = (item: unknown): { size: { x?: number; y?: number } } =>
    (FreeFormBlock.configSchema.parse({ type: FreeFormBlock.key, items: [item] }) as { items: { size: { x?: number; y?: number } }[] }).items[0];

  const base = { block: { type: TextBlock.key } };
  // A fresh item is still a visible 25% box.
  assert.deepEqual(parse(base).size, { x: 25, y: 25 }, "omitted size keeps the default box");
  // Either axis can be cleared on its own to fit the block. A cleared axis is absent, not
  // undefined, which is what makes the render emit no width/height at all for it.
  assert.deepEqual(parse({ ...base, size: { y: 40 } }).size, { y: 40 }, "width fits the block");
  assert.deepEqual(parse({ ...base, size: { x: 40 } }).size, { x: 40 }, "height fits the block");
  assert.deepEqual(parse({ ...base, size: {} }).size, {}, "both axes fit the block");
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

//* grid layout: an axis is its track list, and an empty axis arranges itself

{
  assert.equal(GridConfigSchema.safeParse({ templateColumns: "1fr 2.5fr auto 100px 30%" }).success, true);
  assert.equal(GridConfigSchema.safeParse({ templateColumns: "minmax(0, 1fr)" }).success, false, "only fr/%/px/auto tokens");
  assert.equal(GridConfigSchema.safeParse({ templateRows: "" }).success, false, "empty string is invalid; omit for automatic");
  assert.equal(GridConfigSchema.safeParse({}).success, true, "an unconfigured grid is valid and arranges itself");
  // The counts this replaced are unknown keys now, so an older grid loses them rather than
  // failing to parse, and falls back to the automatic arrangement.
  const legacy = GridConfigSchema.parse({ rows: 3, columns: 4 }) as Record<string, unknown>;
  assert.deepEqual(Object.keys(legacy), [], "old counts are dropped, not rejected");

  // Track lists round-trip, and refuse what the editor can't show.
  assert.deepEqual(parseTracks("1fr 2fr auto"), [{ value: 1, unit: "fr" }, { value: 2, unit: "fr" }, { unit: "auto" }]);
  assert.deepEqual(parseTracks(""), [], "no tracks is automatic, not an error");
  assert.equal(parseTracks("repeat(2, 1fr)"), null);
  assert.equal(parseTracks("1"), null, "a sized track needs a unit");
  assert.equal(formatTracks(parseTracks("30% 1fr auto") as Track[]), "30% 1fr auto");
  assert.equal(formatTracks([]), undefined, "clearing the tracks clears the field");

  // An unset axis must emit no inline style at all, or it would beat view.css's automatic
  // arrangement: an inline style wins over every stylesheet rule.
  const auto = GridBlock.boxStyles(GridBlock.configSchema.parse({ type: GridBlock.key }) as never);
  assert.equal(auto.gridTemplateColumns, undefined, "an unset axis leaves the arrangement to CSS");
  assert.equal(auto.gridTemplateRows, undefined);
  const stated = GridBlock.boxStyles(
    GridBlock.configSchema.parse({ type: GridBlock.key, layout: { templateColumns: "1fr 2fr" } }) as never,
  );
  assert.equal(stated.gridTemplateColumns, "1fr 2fr", "a stated axis overrides it inline");
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

// ── Box sizing v2 ─────────────────────────────────────────────────────
// Size is a per-axis {x, y} pair, defaulting from the block itself, with bounds and ratio
// beside it. These pin the defaults and the value space; the render mapping is verified by
// browser measurement, not here.
{
  // Each block's own default reaches both axes.
  const textDefault = TextBlock.configSchema.parse({ type: TextBlock.key, text: "x" });
  assert.deepEqual(textDefault.style.size, { x: "content", y: "content" }, "text hugs by default");

  const containerDefault = ContainerBlock.configSchema.parse({
    type: ContainerBlock.key,
    block: { type: TextBlock.key, text: "x" }, // a child is still required; step 5 relaxes that
  });
  assert.deepEqual(containerDefault.style.size, { x: "container", y: "container" });

  // One axis set leaves the other on the block default, which is the point of the pair.
  const half = TextBlock.configSchema.parse({ type: TextBlock.key, text: "x", style: { size: { x: "50%" } } });
  assert.equal(half.style.size?.x, "50%");
  assert.equal(half.style.size?.y, "content", "the untouched axis keeps the block default");

  // Lengths and keywords are both accepted, and stored verbatim (no unit normalising).
  const sized = TextBlock.configSchema.parse({
    type: TextBlock.key, text: "x",
    style: { size: { x: "12px", y: "container" }, minSize: { x: "50%" }, maxSize: { y: "10vh" }, aspectRatio: "16/9" },
  });
  assert.deepEqual(sized.style.size, { x: "12px", y: "container" });
  assert.equal(sized.style.minSize?.x, "50%");
  assert.equal(sized.style.maxSize?.y, "10vh");
  assert.equal(sized.style.aspectRatio, "16/9");

  // Bounds and ratio have no defaults: unset must stay unset, or every block would pin itself.
  const bare = DividerBlock.configSchema.parse({ type: DividerBlock.key });
  assert.deepEqual(bare.style.minSize, {}, "no default minimum");
  assert.deepEqual(bare.style.maxSize, {}, "no default maximum");
  assert.equal(bare.style.aspectRatio, undefined);

  // Alignment is universal now: any block can be smaller than its slot, so all can place it.
  assert.deepEqual(bare.style.alignment, { horizontal: "center", vertical: "middle" });
}

// ── cssSize: one axis round-trips, and says so when it cannot ───────────────────
{
  assert.deepEqual(parseSize(undefined), { unit: "px" }, "unset is an empty px value");
  assert.deepEqual(parseSize(""), { unit: "px" });
  assert.deepEqual(parseSize("content"), { keyword: "content", unit: "px" });
  assert.deepEqual(parseSize("container"), { keyword: "container", unit: "px" });
  assert.deepEqual(parseSize("12px"), { value: 12, unit: "px" });
  assert.deepEqual(parseSize("50%"), { value: 50, unit: "%" });
  assert.deepEqual(parseSize("10vh"), { value: 10, unit: "vh" });
  assert.deepEqual(parseSize(" 8 "), { value: 8, unit: "px" }, "a bare number is px");

  // Anything CSS-valid but not representable falls back to raw text rather than being rewritten.
  assert.equal(parseSize("calc(100% - 10px)"), null);
  assert.equal(parseSize("fit-content"), null);
  assert.equal(parseSize("auto"), null);

  // Round-trip, including the two values that must not gain noise.
  for (const raw of ["12px", "50%", "content", "container", "1.5rem"])
    assert.equal(formatSize(parseSize(raw)!), raw, `${raw} round-trips`);
  assert.equal(formatSize({ unit: "px" }), undefined, "no value means unset");
  assert.equal(formatSize({ value: 0, unit: "%" }), "0", "zero carries no unit");
}

console.log("blockUtils.check: all assertions passed");
