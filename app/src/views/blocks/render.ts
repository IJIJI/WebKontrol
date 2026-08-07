import { html, render as litRender, type TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { isBroken, type BrokenBlock, type RenderContext, type ResolvedNode } from "./types/model";
import { blockStyles, slotStyles } from "./styles";
import { resolveBlock } from "./resolver";
import type { BlockStyle } from "./types/schema";
import type { BlockTypeRegistry } from "./registry";

/**
 * The client-side render core. Every block is painted as a fixed two-element skeleton this
 * module owns:
 *
 * ```
 * <div class="wk-slot">          the space the parent gave the block; places the box in it
 *   <div class="wk-block wk-x">  the block's own box: all its styling, fills or hugs
 *      …the block's render() output…
 * ```
 *
 * Blocks therefore never build their own box, and every block (plugin blocks included) is
 * styleable without writing any styling code. A block emits its box's contents and, when it
 * is a container itself, tunes its box through `boxStyles` (see AbstractBlockType).
 *
 * Producing the template is pure and DOM-free; only {@link renderBlockView} touches the DOM.
 */

/**
 * One context per top-level render (i.e. per view paint), shared by every block
 * in that tree via closure. It carries nothing yet; live-data access will
 * hang its per-render subscriptions here, which is why it is created per render
 * rather than being a module-level singleton.
 */
function createRenderContext(): RenderContext {
  const ctx: RenderContext = {
    renderChild(child: ResolvedNode): TemplateResult {
      return renderNode(child, ctx);
    },
  };
  return ctx;
}

/** This namespace's blocks get short `wk-text` classes; others are namespaced to avoid clashes. */
function blockClass(key: string): string {
  const [namespace, , type] = key.split("::");
  return namespace === "webkontrol" ? `wk-${type}` : `wk-${namespace}-${type}`;
}

/** One block: the slot/box skeleton around whatever the block itself renders. */
function renderNode(node: ResolvedNode, ctx: RenderContext): TemplateResult {
  if (isBroken(node)) {
    return html`<div class="wk-slot">
      <div class="wk-block wk-broken">${brokenContent(node)}</div>
    </div>`;
  }

  // Every block's schema carries the injected `style` (see blockStyleSchema); the cast is the
  // one place that knows the convention, so blocks and the resolver stay unaware of it.
  const style = (node.config as { style?: BlockStyle }).style ?? {};
  const hug = style.sizing === "content";

  return html`<div
    class="wk-slot${hug ? " wk-hug" : ""}"
    style=${styleMap({ ...slotStyles(style.alignment), ...node.def.slotStyles(node.config) })}
  >
    <div
      class="wk-block ${blockClass(node.def.key)}"
      style=${styleMap({ ...blockStyles(style), ...node.def.boxStyles(node.config) })}
    >
      ${node.def.render(node.config, ctx)}
    </div>
  </div>`;
}

/**
 * A block that could not be resolved. Visible rather than silent: a broken block on a wall
 * display should be obvious, not a gap nobody notices for a week. Styled by the host page's
 * default stylesheet (view.css).
 */
function brokenContent(block: BrokenBlock): TemplateResult {
  return html`<div class="text">
      <div class="type">${block.type}</div>
      <div class="message">${block.message}</div>
    </div>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path
        d="M12 2 1 21h22L12 2zm0 5.5 7.5 12.9h-15L12 7.5zM11 10v5h2v-5h-2zm0 6.5V18h2v-1.5h-2z"
      ></path>
    </svg>`;
}

/** Render a resolved block tree to a Lit template. Pure; no DOM required. */
export function renderResolvedBlock(root: ResolvedNode): TemplateResult {
  return createRenderContext().renderChild(root); // TODO: One context per block or per view?
}

/**
 * Resolve a raw root block config against the registry and paint its tree into a
 * DOM container. The browser entry point for a block view. Requires a DOM,
 * so it is only ever imported by the client bundle, never the node backend.
 */
export function renderBlockView(
  raw: unknown,
  registry: BlockTypeRegistry,
  container: HTMLElement | DocumentFragment,
): void {
  const root = resolveBlock(raw, registry);
  litRender(renderResolvedBlock(root), container);
}
