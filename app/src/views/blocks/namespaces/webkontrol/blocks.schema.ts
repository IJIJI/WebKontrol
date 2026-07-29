import z from "zod";
import { html } from "lit";
import { blockSlot, ContainerBlockStyleSchema, CoordinateSchema, GridConfigSchema, TextBlockStyleSchema } from "../../types/schema";
import { createNamespace } from "../../types/config";

export const ns = createNamespace("webkontrol");

// WebsiteBlock: display a website.
export const WebsiteBlock = ns.defineBlock("website", {
  url: z.url(),
}, {
  render: (config) => html`<iframe src=${config.url} style="border:0;width:100%;height:100%"></iframe>`,
});

// TextBlock: show some styled text.
export const TextBlock = ns.defineBlock("text", {
  text: z.string(),
  style: TextBlockStyleSchema,
}, {
  render: (config) => html`<span>${config.text}</span>`, // TODO: apply config.style
});

// ContainerBlock: wrap another block to give it styling it does not have itself.
export const ContainerBlock = ns.defineBlock("container", {
  block: blockSlot(),
  style: ContainerBlockStyleSchema,
}, {
  render: (config, ctx) => html`<div>${ctx.renderChild(config.block)}</div>`, // TODO: apply config.style
});

// GridBlock: Arranges child blocks into the best grid for them.
// TODO: Check if it is possible and or smart to do a auto arrange, and make layout optional
// TODO: Check if these defaults are the right.
// TODO: add the option to define grid templates, instead of the layout?
export const GridBlock = ns.defineBlock("grid", {
  layout: GridConfigSchema.default({ rows: 2, columns: 2 }),
  blocks: z.array(blockSlot()),
}, {
  render: (config, ctx) => html`<div class="grid">${config.blocks.map((block) => ctx.renderChild(block))}</div>`,
});

// FreeFormBlock: position each child block wherever you want.
export const FreeFormBlock = ns.defineBlock("freeform", {
  items: z.array(z.object({ // TODO: Should these items have their own schema?
    block: blockSlot(),
    position: CoordinateSchema,
    size: CoordinateSchema,
  })),
}, {
  render: (config, ctx) => html`<div class="freeform" style="position:relative">${config.items.map((item) => html`
    <div style="position:absolute;left:${item.position.x}%;top:${item.position.y}%;width:${item.size.x}%;height:${item.size.y}%">
      ${ctx.renderChild(item.block)}
    </div>`)}</div>`,
});

// DateTimeBlock: show the current date/time in a configurable format.
export const DateTimeBlock = ns.defineBlock("datetime", {
  format: z.string().regex(/^(?:[dDjlNSwzWFmMntLoYyaABgGhHisuveIOPpTZcrU]|\\.|[\s\-/:.,|])+$/).optional().default("H:i:s"),
  style: TextBlockStyleSchema,
}, {
  render: (config) => html`<span>${config.format}</span>`, // TODO: format the current time per config.format + apply config.style
});
