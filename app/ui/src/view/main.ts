import { blockTypeRegistry } from "../../../src/views/blocks/registry";
import "../../../src/views/blocks/namespaces/webkontrol/index"; // side-effect: register the webkontrol blocks
import { renderBlockView } from "../../../src/views/blocks/render";

// The dedicated, React-free renderer for block views. Vite serves this entry for
// every /view/:key that resolves to a block view (see ViewManager._serve passthrough).

const container = document.querySelector<HTMLElement>("#view-root");
if (!container) throw new Error("#view-root missing from the view host page.");

// The view key this page is showing, parsed from the path (/view/:key).
export const viewKey = window.location.pathname.split("/").filter(Boolean).pop() ?? ""; // TODO: Check this

// TODO Replace this sample with the block config streamed over SSE for `viewKey`.
const sampleConfig = {
  type: "webkontrol::block::container",
  style: { padding: "24px", background: "#111" },
  block: {
    type: "webkontrol::block::grid",
    blocks: [
      { type: "webkontrol::block::text", text: `view: ${viewKey}`, style: {} },
      { type: "webkontrol::block::text", text: "block renderer online", style: {} },
    ],
  },
};

renderBlockView(sampleConfig, blockTypeRegistry, container);
