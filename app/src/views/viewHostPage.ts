import fs from "node:fs";
import path from "node:path";

/**
 * The HTML host page for client-rendered block views. It boots the dedicated,
 * React-free Lit renderer bundle (see ui/src/view/main.ts), which reads the view
 * key from the path and paints the block tree.
 *
 * This is the single place that knows where the view entry lives, keeping that
 * frontend-build knowledge out of ViewManager. We serve the file ourselves (rather
 * than routing through Vite's HTML middleware) so the view stays decoupled from the
 * route base and from the React build config.
 */

// Dev: Vite's middleware serves the referenced /src/view/main.ts module (and its
// imports) on demand, so no transformIndexHtml is needed. HMR (/@vite/client) is
// deliberately not injected — the page renders; source edits need a manual refresh.
const DEV_HTML = path.join(process.cwd(), "ui", "view", "index.html");
// Prod: the built entry. TODO: the frontend prod build is not wired yet (neither is
// React's); when it is, it must emit this file. See vite.config.ts.
const PROD_HTML = path.join(process.cwd(), "dist", "ui", "view", "index.html");

let _prodCache: string | undefined;

/** Read the block-view host page HTML for the current mode. */
export function getViewHostHtml(): string {
  if (process.env.NODE_ENV === "production") {
    _prodCache ??= fs.readFileSync(PROD_HTML, "utf8");
    return _prodCache;
  }
  // Re-read each request in dev so edits to the host page show on refresh.
  return fs.readFileSync(DEV_HTML, "utf8");
}
