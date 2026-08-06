import { html, render as litRender, type TemplateResult } from "lit";
import { isBroken, type BrokenBlock, type RenderContext, type ResolvedNode } from "./types/model";
import { resolveBlock } from "./resolver";
import type { BlockTypeRegistry } from "./registry";

/**
 * The client-side render core. A block emits a Lit template and renders its own
 * children by calling {@link RenderContext.renderChild} on the ResolvedBlocks
 * sitting in its (already resolved) config, so a single top-level call walks the
 * whole tree depth-first. Producing the template is pure and DOM-free; only
 * {@link renderBlockView} touches the DOM.
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
      return isBroken(child) ? renderBroken(child) : child.def.render(child.config, ctx);
    },
  };
  return ctx;
}

/**
 * A block that could not be resolved. Visible rather than silent: a broken block on a wall
 * display should be obvious, not a gap nobody notices for a week. Styles are inline because the
 * host page carries no stylesheet of its own.
 */
function renderBroken(block: BrokenBlock): TemplateResult {
  return html`<div
    style="display:flex;align-items:center;gap:8px;box-sizing:border-box;width:100%;height:100%;
           padding:12px;border:2px solid #e93838;border-radius:8px;background:rgba(233,56,56,0.08);
           color:#e93838;font-family:sans-serif;font-size:14px"
  >
    <div style="flex:1;min-width:0">
      <div style="font-weight:600">${block.type}</div>
      <div style="opacity:0.85">${block.message}</div>
    </div>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" style="flex:none">
      <path
        d="M12 2 1 21h22L12 2zm0 5.5 7.5 12.9h-15L12 7.5zM11 10v5h2v-5h-2zm0 6.5V18h2v-1.5h-2z"
      ></path>
    </svg>
  </div>`;
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
