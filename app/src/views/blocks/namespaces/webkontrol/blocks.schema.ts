import z from "zod";
import { html, nothing } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { fitScale } from "../../fitScale";
import { alignmentSchema, blockSlot, CoordinateSchema, DimensionSchema, GridConfigSchema } from "../../types/schema";
import { textBoxStyles } from "../../styles";
import { clock } from "../../clock";
import { PHP_DATE_TOKENS } from "../../phpDate";
import { createNamespace } from "../../types/config";
import type { FieldMeta } from "../../../types/schema";

// Every block below renders only the *contents* of its box: the render core wraps each one in
// the slot/box skeleton and applies its injected `style`, so no block styles itself. A block
// that is a container tunes its own box through `boxStyles` (config-driven values only;
// structural rules live on its `wk-` class in view.css).

export const ns = createNamespace("webkontrol");

// WebsiteBlock: display a website.
export const WebsiteBlock = ns.defineBlock("website", {
  url: z.url().meta({ label: "URL", description: "The website to display" } satisfies FieldMeta),
  scaling: z.enum(["fit", "off"]).default("fit").meta({ label: "Scaling", description: "Render the page at full display size, scaled to fit this block", input: "buttons" } satisfies FieldMeta),
  // A cross-origin iframe's scrollbar cannot be styled from outside, only hidden.
  scrollbar: z.enum(["hidden", "auto"]).default("hidden").meta({ label: "Scrollbar", input: "buttons" } satisfies FieldMeta),
}, {
  info: { label: "Website", description: "Display a website", icon: "globe" },
  // The box is the measurable frame; the iframe inside is either plain 100% (scaling off) or
  // sized/scaled by the fitScale directive, which measures that box.
  render: (config) => html`<iframe
    src=${config.url}
    scrolling=${config.scrollbar === "hidden" ? "no" : nothing}
    ${config.scaling === "fit" ? fitScale() : nothing}
  ></iframe>`,
});

// TextBlock: show some styled text.
export const TextBlock = ns.defineBlock("text", {
  // Trimmed: the block renders with `white-space: pre-line`, which makes newlines significant,
  // so a stray trailing return from the textarea would show up as a blank line. Interior blank
  // lines (paragraph breaks) are untouched; space *around* the text is what padding is for.
  text: z.string().trim().meta({ label: "Text", input: "textarea" } satisfies FieldMeta),
}, {
  info: { label: "Text", description: "Show some styled text", icon: "textFields" },
  box: { sizing: "content" },
  // The one alignment both places the box and lays the text out inside it.
  boxStyles: (config) => textBoxStyles(config.style.alignment),
  render: (config) => html`${config.text}`,
});

// ContainerBlock: wrap another block to give it styling it does not have itself.
// The child stays required: a container without one would be indistinguishable from a spacer,
// which is already a block that renders nothing and carries the universal box. An empty slot
// also has nowhere for the editor to hang its add button, since childBlocks reports slots by
// what fills them.
export const ContainerBlock = ns.defineBlock("container", {
  block: blockSlot({ label: "Content" }),
}, {
  info: { label: "Container", description: "Wrap a block in an extra box", icon: "borderOuter" },
  box: { sizing: "container" },
  render: (config, ctx) => ctx.renderChild(config.block),
});

// GridBlock: Arranges child blocks into the best grid for them.
// TODO: Check if it is possible and or smart to do a auto arrange, and make layout optional
// TODO: Check if these defaults are the right.
// TODO: add the option to define grid templates, instead of the layout?
export const GridBlock = ns.defineBlock("grid", {
  layout: GridConfigSchema.prefault({}).meta({ label: "Layout" } satisfies FieldMeta),
  // Defaulted so a freshly added grid (just its type) is already a valid, empty grid.
  blocks: z.array(blockSlot()).default([]).meta({ label: "Blocks" } satisfies FieldMeta),
}, {
  info: { label: "Grid", description: "Arrange blocks in a grid", icon: "grid" },
  // Only what the config states. An axis left empty emits nothing, which lets view.css arrange
  // the grid by its block count and the display's orientation: an inline style would beat any
  // stylesheet rule, so staying silent here is what makes that table possible (and overridable).
  boxStyles: (config) => ({
    gridTemplateColumns: config.layout.templateColumns,
    gridTemplateRows: config.layout.templateRows,
    gap: config.layout.gap === undefined ? undefined : `${config.layout.gap}px`,
  }),
  render: (config, ctx) => html`${config.blocks.map((block) => ctx.renderChild(block))}`,
});

// FreeFormBlock: position each child block wherever you want. Items later in the list render
// on top of earlier ones (plain paint order, no z-index involved); reorder to layer.
const ANCHOR_SHIFT = { left: "0", center: "-50%", right: "-100%", top: "0", middle: "-50%", bottom: "-100%" } as const;
const ANCHOR_ORIGIN = { left: "left", center: "center", right: "right", top: "top", middle: "center", bottom: "bottom" } as const;

export const FreeFormBlock = ns.defineBlock("freeform", {
  items: z.array(z.object({ // TODO: Should these items have their own schema?
    block: blockSlot({ label: "Block" }),
    // Prefaulted so a freshly added (empty) item is already positioned somewhere sensible.
    position: CoordinateSchema.prefault({ x: 0, y: 0 }).meta({ label: "Position", description: "In % of the screen" } satisfies FieldMeta),
    // Per-axis optional: an unset axis sizes the item to its block instead of to a percentage,
    // which is how a chip gets an item that is exactly as big as its text. Prefaulted as a
    // whole, so a freshly added item is still a visible 25% box.
    size: z.object({
      x: DimensionSchema.optional().meta({ label: "X", description: "Width in %. Unset fits the block (only blocks that can hug, e.g. text)" } satisfies FieldMeta),
      y: DimensionSchema.optional().meta({ label: "Y", description: "Height in %. Unset fits the block (only blocks that can hug, e.g. text)" } satisfies FieldMeta),
    }).prefault({ x: 25, y: 25 }).meta({ label: "Size", description: "In % of the screen" } satisfies FieldMeta),
    alignment: alignmentSchema("left", "top").meta({ label: "Alignment", description: "Which point of the item the position places", input: "alignment" } satisfies FieldMeta),
    rotation: z.number().min(-180).max(180).optional().meta({ label: "Rotation", description: "Degrees, clockwise", placeholder: "0", input: "range" } satisfies FieldMeta),
  })).default([]).meta({ label: "Items", description: "Later items render on top" } satisfies FieldMeta),
}, {
  info: { label: "Free form", description: "Position blocks freely", icon: "selectWindow" },
  render: (config, ctx) => html`${config.items.map((item) => html`
    <div class="wk-freeform-item" style=${styleMap({
      left: `${item.position.x}%`,
      top: `${item.position.y}%`,
      // Unset = auto: the absolutely positioned item shrink-wraps its block on that axis.
      width: item.size.x === undefined ? undefined : `${item.size.x}%`,
      height: item.size.y === undefined ? undefined : `${item.size.y}%`,
      // The translate puts the item's alignment point on `position`; the matching
      // transform-origin makes rotation pivot around that same anchored point.
      transform: `translate(${ANCHOR_SHIFT[item.alignment.horizontal]}, ${ANCHOR_SHIFT[item.alignment.vertical]})${
        item.rotation ? ` rotate(${item.rotation}deg)` : ""}`,
      transformOrigin: `${ANCHOR_ORIGIN[item.alignment.horizontal]} ${ANCHOR_ORIGIN[item.alignment.vertical]}`,
    })}>
      ${ctx.renderChild(item.block)}
    </div>`)}`,
});

// DateTimeBlock: show the current date/time in a configurable format.
export const DateTimeBlock = ns.defineBlock("datetime", {
  // The regex admits exactly the tokens formatPhpDate implements (plus escapes and separators),
  // so the editor rejects formats the renderer can't do. PHP_DATE_TOKENS is the shared source.
  format: z.string().regex(new RegExp(`^(?:[${PHP_DATE_TOKENS}]|\\\\.|[\\s\\-/:.,|])+$`)).optional().default("H:i:s").meta({ label: "Format", description: "PHP-style date format, e.g. H:i:s" } satisfies FieldMeta),
}, {
  info: { label: "Date & time", description: "Show the current date/time", icon: "schedule" },
  box: { sizing: "content" },
  boxStyles: (config) => textBoxStyles(config.style.alignment),
  render: (config) => html`${clock(config.format)}`,
});

// ImageBlock: display an image.
export const ImageBlock = ns.defineBlock("image", {
  url: z.url().meta({ label: "URL", description: "The image to display" } satisfies FieldMeta),
  fit: z.enum(["cover", "contain", "fill"]).default("cover").meta({ label: "Fit", description: "How the image fills the block", input: "buttons" } satisfies FieldMeta),
}, {
  info: { label: "Image", description: "Display an image", icon: "image" },
  box: { sizing: "container" },
  // object-fit belongs to the <img>, not the box around it. So does the per-axis fill: an axis
  // the box fills wants the image to fill it too (so `fit` can crop or letterbox), while an
  // axis the box hugs must leave the image free, or the percentage is circular and the box
  // ends up at the image's intrinsic size. Leaving one axis auto is also what lets a
  // constrained height derive the width from the intrinsic ratio.
  render: (config) => html`<img src=${config.url} alt="" style=${styleMap({
    objectFit: config.fit,
    width: config.style.size?.x === "container" ? "100%" : "auto",
    height: config.style.size?.y === "container" ? "100%" : "auto",
  })} />`,
});

// SpacerBlock: an empty block, e.g. to leave a grid cell open or push stack siblings apart.
// It carries no fields of its own: the universal box's per-axis size says everything its old
// `size` did and says it on both axes, and having two owners for one dimension meant a margin
// had nowhere to inset (the field pinned the slot while the margin insets the box inside it).
// What is left is discoverability: "Spacer" in the picker names an intent nobody would go
// looking for a container to satisfy.
export const SpacerBlock = ns.defineBlock("spacer", {}, {
  info: { label: "Spacer", description: "Empty space", icon: "spaceBar" },
  render: () => html``,
});

// DividerBlock: a separating line, centered in its block. The default line color lives in the
// stylesheet (.wk-divider-line), the config color overrides it.
export const DividerBlock = ns.defineBlock("divider", {
  direction: z.enum(["horizontal", "vertical"]).default("horizontal").meta({ label: "Direction", input: "buttons" } satisfies FieldMeta),
  // Optional: the direction class in view.css carries the default thickness, so an unset value
  // stays overridable by user CSS. Only a set value is pinned inline, on the short axis.
  thickness: z.number().min(1).max(100).optional().meta({ label: "Thickness", description: "In px. Unset follows the stylesheet (2px)" } satisfies FieldMeta),
  color: z.string().optional().meta({ label: "Color", description: "CSS color", input: "color" } satisfies FieldMeta),
}, {
  info: { label: "Divider", description: "A separating line", icon: "horizontalRule" },
  render: (config) => html`<div class="wk-divider-line ${config.direction}" style=${styleMap({
    background: config.color,
    ...(config.thickness === undefined
      ? {}
      : config.direction === "horizontal" ? { height: `${config.thickness}px` } : { width: `${config.thickness}px` }),
  })}></div>`,
});

// StackBlock: flow child blocks in a row or column (flexbox).
const FLEX_MAP = {
  start: "flex-start", end: "flex-end", center: "center", stretch: "stretch",
  "space-between": "space-between", "space-around": "space-around", "space-evenly": "space-evenly",
} as const;

export const StackBlock = ns.defineBlock("stack", {
  direction: z.enum(["row", "column"]).default("row").meta({ label: "Direction", input: "buttons" } satisfies FieldMeta),
  justify: z.enum(["start", "center", "end", "space-between", "space-around", "space-evenly"]).default("start").meta({ label: "Justify", description: "Distribution along the direction" } satisfies FieldMeta),
  align: z.enum(["stretch", "start", "center", "end"]).default("stretch").meta({ label: "Align", description: "Alignment across the direction" } satisfies FieldMeta),
  gap: z.number().min(0).max(200).optional().meta({ label: "Gap", description: "Space between blocks, in px" } satisfies FieldMeta),
  wrap: z.boolean().default(false).meta({ label: "Wrap", description: "Flow overflowing blocks onto the next line" } satisfies FieldMeta),
  blocks: z.array(blockSlot()).default([]).meta({ label: "Blocks" } satisfies FieldMeta),
}, {
  info: { label: "Stack", description: "Flow blocks in a row or column", icon: "viewColumn" },
  box: { sizing: "container" },
  boxStyles: (config) => ({
    flexDirection: config.direction,
    justifyContent: FLEX_MAP[config.justify],
    alignItems: FLEX_MAP[config.align],
    gap: config.gap === undefined ? undefined : `${config.gap}px`,
    flexWrap: config.wrap ? "wrap" : undefined,
  }),
  render: (config, ctx) => html`${config.blocks.map((block) => ctx.renderChild(block, config.direction))}`,
});

// Every block this namespace ships; index.ts registers from this single list.
export const WEBKONTROL_BLOCKS = [
  WebsiteBlock,
  TextBlock,
  ImageBlock,
  ContainerBlock,
  GridBlock,
  StackBlock,
  FreeFormBlock,
  SpacerBlock,
  DividerBlock,
  DateTimeBlock,
];

