import { render as litRender, type TemplateResult } from "lit";
import type { RenderContext, ResolvedBlock } from "./types/model";
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
    renderChild(child: ResolvedBlock): TemplateResult {
      return child.def.render(child.config, ctx);
    },
  };
  return ctx;
}

/** Render a resolved block tree to a Lit template. Pure; no DOM required. */
export function renderResolvedBlock(root: ResolvedBlock): TemplateResult {
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
