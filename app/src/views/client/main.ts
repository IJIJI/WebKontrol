import { blockTypeRegistry } from "../blocks/registry";
import "../blocks/namespaces/webkontrol/index"; // side-effect: register the webkontrol blocks
import { renderBlockView } from "../blocks/render";

// The dedicated, React-free renderer for block views. Bundled for the browser by
// buildViewClient() and served at /viewclient/main.js. It subscribes to the view's
// SSE config stream and (re-)paints the block tree in place whenever the config changes.

const container = document.querySelector<HTMLElement>("#view-root");
if (!container) throw new Error("#view-root missing from the view host page.");

// This view's config stream is the current path plus "/stream". Deriving it from the
// path (rather than hardcoding /view/) keeps the configurable route base out of the client.
const streamUrl = `${window.location.pathname.replace(/\/$/, "")}/stream`;
const source = new EventSource(streamUrl);

// Each "config" event carries the view's root block config; re-rendering into the same
// container lets Lit diff and update in place (no flash, no reload).
source.addEventListener("config", (event) => {
  const config: unknown = JSON.parse((event as MessageEvent<string>).data);
  renderBlockView(config, blockTypeRegistry, container);
});

// The view was removed or never existed: stop reconnecting.
source.addEventListener("gone", () => source.close());
