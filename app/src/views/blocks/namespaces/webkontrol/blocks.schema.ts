import z from "zod";
import { html, nothing, type TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { fitScale } from "../../fitScale";
import { alignmentSchema, blockSlot, CoordinateSchema, GridConfigSchema, type BlockStyle } from "../../types/schema";
import { containerStyles, placementStyles, textStyles } from "../../styles";
import { clock } from "../../clock";
import { PHP_DATE_TOKENS } from "../../phpDate";
import { createNamespace } from "../../types/config";
import type { FieldMeta } from "../../../types/schema";

// Shared by the text-like blocks: a fill wrapper placing a content element per the style's
// alignment; the content element (`<blockClass>-content`) carries the text/chip styling.
function textTemplate(blockClass: string, style: BlockStyle, content: unknown): TemplateResult {
  const sizing = style.sizing === "container" ? " wk-sizing-container" : "";
  return html`<div class="wk-block wk-align ${blockClass}${sizing}" style=${styleMap(placementStyles(style.alignment))}>
    <span class="${blockClass}-content" style=${styleMap(textStyles(style))}>${content}</span>
  </div>`;
}

export const ns = createNamespace("webkontrol");

// WebsiteBlock: display a website.
export const WebsiteBlock = ns.defineBlock("website", {
  url: z.url().meta({ label: "URL", description: "The website to display" } satisfies FieldMeta),
  scaling: z.enum(["fit", "off"]).default("fit").meta({ label: "Scaling", description: "Render the page at full display size, scaled to fit this block" } satisfies FieldMeta),
  // A cross-origin iframe's scrollbar cannot be styled from outside, only hidden.
  scrollbar: z.enum(["hidden", "auto"]).default("hidden").meta({ label: "Scrollbar" } satisfies FieldMeta),
}, {
  info: { label: "Website", description: "Display a website", icon: "globe" },
  // The wrapper is the measurable block box; the iframe inside is either plain 100% (off) or
  // sized/scaled by the fitScale directive (fit).
  render: (config) => html`<div class="wk-block wk-website" style=${styleMap(containerStyles(config.style))}>
    <iframe src=${config.url} scrolling=${config.scrollbar === "hidden" ? "no" : nothing} ${config.scaling === "fit" ? fitScale() : nothing}></iframe>
  </div>`,
});

// TextBlock: show some styled text.
export const TextBlock = ns.defineBlock("text", {
  text: z.string().meta({ label: "Text", input: "textarea" } satisfies FieldMeta),
}, {
  info: { label: "Text", description: "Show some styled text", icon: "textFields" },
  box: { sizing: "content" },
  render: (config) => textTemplate("wk-text", config.style, config.text),
});

// ContainerBlock: wrap another block to give it styling it does not have itself.
export const ContainerBlock = ns.defineBlock("container", {
  block: blockSlot({ label: "Content" }),
}, {
  info: { label: "Container", description: "Wrap a block to style it", icon: "borderOuter" },
  box: { sizing: "container" },
  render: (config, ctx) => html`<div class="wk-block wk-container" style=${styleMap(containerStyles(config.style))}>${ctx.renderChild(config.block)}</div>`,
});

// GridBlock: Arranges child blocks into the best grid for them.
// TODO: Check if it is possible and or smart to do a auto arrange, and make layout optional
// TODO: Check if these defaults are the right.
// TODO: add the option to define grid templates, instead of the layout?
export const GridBlock = ns.defineBlock("grid", {
  layout: GridConfigSchema.default({ rows: 2, columns: 2 }).meta({ label: "Layout" } satisfies FieldMeta),
  // Defaulted so a freshly added grid (just its type) is already a valid, empty grid.
  blocks: z.array(blockSlot()).default([]).meta({ label: "Blocks" } satisfies FieldMeta),
}, {
  info: { label: "Grid", description: "Arrange blocks in a grid", icon: "grid" },
  render: (config, ctx) => html`<div class="wk-block wk-grid" style=${styleMap({
    ...containerStyles(config.style),
    gridTemplateRows: config.layout.templateRows ?? `repeat(${config.layout.rows}, 1fr)`,
    gridTemplateColumns: config.layout.templateColumns ?? `repeat(${config.layout.columns}, 1fr)`,
    gap: config.layout.gap === undefined ? undefined : `${config.layout.gap}px`,
  })}>${config.blocks.map((block) => ctx.renderChild(block))}</div>`,
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
    size: CoordinateSchema.prefault({ x: 25, y: 25 }).meta({ label: "Size", description: "In % of the screen" } satisfies FieldMeta),
    alignment: alignmentSchema("left", "top").meta({ label: "Alignment", description: "Which point of the item the position places" } satisfies FieldMeta),
    rotation: z.number().min(-180).max(180).optional().meta({ label: "Rotation", description: "Degrees, clockwise" } satisfies FieldMeta),
  })).default([]).meta({ label: "Items", description: "Later items render on top" } satisfies FieldMeta),
}, {
  info: { label: "Free form", description: "Position blocks freely", icon: "selectWindow" },
  render: (config, ctx) => html`<div class="wk-block wk-freeform" style=${styleMap(containerStyles(config.style))}>${config.items.map((item) => html`
    <div class="wk-freeform-item" style=${styleMap({
      left: `${item.position.x}%`,
      top: `${item.position.y}%`,
      width: `${item.size.x}%`,
      height: `${item.size.y}%`,
      // The translate puts the item's alignment point on `position`; the matching
      // transform-origin makes rotation pivot around that same anchored point.
      transform: `translate(${ANCHOR_SHIFT[item.alignment.horizontal]}, ${ANCHOR_SHIFT[item.alignment.vertical]})${
        item.rotation ? ` rotate(${item.rotation}deg)` : ""}`,
      transformOrigin: `${ANCHOR_ORIGIN[item.alignment.horizontal]} ${ANCHOR_ORIGIN[item.alignment.vertical]}`,
    })}>
      ${ctx.renderChild(item.block)}
    </div>`)}</div>`,
});

// DateTimeBlock: show the current date/time in a configurable format.
export const DateTimeBlock = ns.defineBlock("datetime", {
  // The regex admits exactly the tokens formatPhpDate implements (plus escapes and separators),
  // so the editor rejects formats the renderer can't do. PHP_DATE_TOKENS is the shared source.
  format: z.string().regex(new RegExp(`^(?:[${PHP_DATE_TOKENS}]|\\\\.|[\\s\\-/:.,|])+$`)).optional().default("H:i:s").meta({ label: "Format", description: "PHP-style date format, e.g. H:i:s" } satisfies FieldMeta),
}, {
  info: { label: "Date & time", description: "Show the current date/time", icon: "schedule" },
  box: { sizing: "content" },
  render: (config) => textTemplate("wk-datetime", config.style, clock(config.format)),
});

// ImageBlock: display an image.
export const ImageBlock = ns.defineBlock("image", {
  url: z.url().meta({ label: "URL", description: "The image to display" } satisfies FieldMeta),
  fit: z.enum(["cover", "contain", "fill"]).default("cover").meta({ label: "Fit", description: "How the image fills the block" } satisfies FieldMeta),
}, {
  info: { label: "Image", description: "Display an image", icon: "image" },
  box: { sizing: "container" },
  render: (config) => html`<img class="wk-block wk-image" src=${config.url} alt=""
    style=${styleMap({ ...containerStyles(config.style), objectFit: config.fit })} />`,
});

// SpacerBlock: an empty block, e.g. to leave a grid cell open or push stack siblings apart.
export const SpacerBlock = ns.defineBlock("spacer", {
  size: z.number().min(1).max(2000).optional().meta({ label: "Size", description: "Fixed size along a stack's direction, in px. Unset shares the space" } satisfies FieldMeta),
}, {
  info: { label: "Spacer", description: "Empty space", icon: "spaceBar" },
  render: (config) => html`<div class="wk-block wk-spacer" style=${styleMap({
    ...containerStyles(config.style),
    // In a stack: a set size is fixed (no grow/shrink); unset shares space. Inert elsewhere.
    flex: config.size === undefined ? undefined : `0 0 ${config.size}px`,
  })}></div>`,
});

// DividerBlock: a separating line, centered in its block. The default line color lives in the
// stylesheet (.wk-divider-line), the config color overrides it.
export const DividerBlock = ns.defineBlock("divider", {
  direction: z.enum(["horizontal", "vertical"]).default("horizontal").meta({ label: "Direction" } satisfies FieldMeta),
  thickness: z.number().min(1).max(100).default(2).meta({ label: "Thickness", description: "In px" } satisfies FieldMeta),
  color: z.string().optional().meta({ label: "Color", description: "CSS color", input: "color" } satisfies FieldMeta),
}, {
  info: { label: "Divider", description: "A separating line", icon: "horizontalRule" },
  render: (config) => html`<div class="wk-block wk-divider" style=${styleMap(containerStyles(config.style))}>
    <div class="wk-divider-line" style=${styleMap({
      background: config.color,
      width: config.direction === "horizontal" ? "100%" : `${config.thickness}px`,
      height: config.direction === "horizontal" ? `${config.thickness}px` : "100%",
    })}></div>
  </div>`,
});

// StackBlock: flow child blocks in a row or column (flexbox).
const FLEX_MAP = {
  start: "flex-start", end: "flex-end", center: "center", stretch: "stretch",
  "space-between": "space-between", "space-around": "space-around", "space-evenly": "space-evenly",
} as const;

export const StackBlock = ns.defineBlock("stack", {
  direction: z.enum(["row", "column"]).default("row").meta({ label: "Direction" } satisfies FieldMeta),
  justify: z.enum(["start", "center", "end", "space-between", "space-around", "space-evenly"]).default("start").meta({ label: "Justify", description: "Distribution along the direction" } satisfies FieldMeta),
  align: z.enum(["stretch", "start", "center", "end"]).default("stretch").meta({ label: "Align", description: "Alignment across the direction" } satisfies FieldMeta),
  gap: z.number().min(0).max(200).optional().meta({ label: "Gap", description: "Space between blocks, in px" } satisfies FieldMeta),
  wrap: z.boolean().default(false).meta({ label: "Wrap", description: "Flow overflowing blocks onto the next line" } satisfies FieldMeta),
  blocks: z.array(blockSlot()).default([]).meta({ label: "Blocks" } satisfies FieldMeta),
}, {
  info: { label: "Stack", description: "Flow blocks in a row or column", icon: "viewColumn" },
  box: { sizing: "container" },
  render: (config, ctx) => html`<div class="wk-block wk-stack" style=${styleMap({
    ...containerStyles(config.style),
    flexDirection: config.direction,
    justifyContent: FLEX_MAP[config.justify],
    alignItems: FLEX_MAP[config.align],
    gap: config.gap === undefined ? undefined : `${config.gap}px`,
    flexWrap: config.wrap ? "wrap" : undefined,
  })}>${config.blocks.map((block) => ctx.renderChild(block))}</div>`,
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

