import z from "zod";
import { html } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { blockSlot, ContainerBlockStyleSchema, CoordinateSchema, GridConfigSchema, TextBlockStyleSchema } from "../../types/schema";
import { containerStyles, textStyles } from "../../styles";
import { createNamespace } from "../../types/config";
import type { FieldMeta } from "../../../types/schema";

export const ns = createNamespace("webkontrol");

// WebsiteBlock: display a website.
export const WebsiteBlock = ns.defineBlock("website", {
  url: z.url().meta({ label: "URL", description: "The website to display" } satisfies FieldMeta),
}, {
  info: { label: "Website", description: "Display a website", icon: "globe" },
  render: (config) => html`<iframe class="wk-block wk-website" src=${config.url}></iframe>`,
});

// TextBlock: show some styled text.
export const TextBlock = ns.defineBlock("text", {
  text: z.string().meta({ label: "Text" } satisfies FieldMeta),
  style: TextBlockStyleSchema.meta({ label: "Style" } satisfies FieldMeta),
}, {
  info: { label: "Text", description: "Show some styled text", icon: "textFields" },
  render: (config) => html`<div class="wk-block wk-text" style=${styleMap(textStyles(config.style))}>${config.text}</div>`,
});

// ContainerBlock: wrap another block to give it styling it does not have itself.
export const ContainerBlock = ns.defineBlock("container", {
  block: blockSlot({ label: "Content" }),
  style: ContainerBlockStyleSchema.meta({ label: "Style" } satisfies FieldMeta),
}, {
  info: { label: "Container", description: "Wrap a block to style it", icon: "borderOuter" },
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
  render: (config, ctx) => html`<div class="grid">${config.blocks.map((block) => ctx.renderChild(block))}</div>`,
});

// FreeFormBlock: position each child block wherever you want.
export const FreeFormBlock = ns.defineBlock("freeform", {
  items: z.array(z.object({ // TODO: Should these items have their own schema?
    block: blockSlot({ label: "Block" }),
    // Prefaulted so a freshly added (empty) item is already positioned somewhere sensible.
    position: CoordinateSchema.prefault({ x: 0, y: 0 }).meta({ label: "Position", description: "In % of the screen" } satisfies FieldMeta),
    size: CoordinateSchema.prefault({ x: 25, y: 25 }).meta({ label: "Size", description: "In % of the screen" } satisfies FieldMeta),
  })).default([]).meta({ label: "Items" } satisfies FieldMeta),
}, {
  info: { label: "Free form", description: "Position blocks freely", icon: "selectWindow" },
  render: (config, ctx) => html`<div class="wk-block wk-freeform">${config.items.map((item) => html`
    <div class="wk-freeform-item" style=${styleMap({
      left: `${item.position.x}%`,
      top: `${item.position.y}%`,
      width: `${item.size.x}%`,
      height: `${item.size.y}%`,
    })}>
      ${ctx.renderChild(item.block)}
    </div>`)}</div>`,
});

// DateTimeBlock: show the current date/time in a configurable format.
export const DateTimeBlock = ns.defineBlock("datetime", {
  format: z.string().regex(/^(?:[dDjlNSwzWFmMntLoYyaABgGhHisuveIOPpTZcrU]|\\.|[\s\-/:.,|])+$/).optional().default("H:i:s").meta({ label: "Format", description: "PHP-style date format, e.g. H:i:s" } satisfies FieldMeta),
  style: TextBlockStyleSchema.meta({ label: "Style" } satisfies FieldMeta),
}, {
  info: { label: "Date & time", description: "Show the current date/time", icon: "schedule" },
  render: (config) => html`<span>${config.format}</span>`, // TODO: format the current time per config.format + apply config.style
});

// Every block this namespace ships; index.ts registers from this single list.
export const WEBKONTROL_BLOCKS = [
  WebsiteBlock,
  TextBlock,
  ContainerBlock,
  GridBlock,
  FreeFormBlock,
  DateTimeBlock,
];

