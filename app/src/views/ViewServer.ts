import type { RouteRegistrar, RouteRequest, RouteResponse, SseConnection } from "../webServer/model";
import type { ViewKey } from "./types/schema";
import type { ViewManager } from "./ViewManager";
import { BlockViewClient } from "./client/BlockViewClient";
import { Logger } from "../logging/Logger";

// Fixed path the host page loads the browser bundle from. Kept out of the route base
// (a single segment under it would collide with /:key), and referenced by client/index.html.
// TODO: Sync paths between ViewServer and BlockViewClient
const VIEW_CLIENT_BUNDLE_PATH = "/viewclient/main.js";
const VIEW_CLIENT_STYLE_PATH = "/viewclient/view.css";

/**
 * Serves views over HTTP/SSE. The transport half of the views feature: it registers the
 * routes, dispatches by view kind (block → host page + bundle + config stream, url → 302),
 * and owns the per-view SSE subscriptions and the block renderer bundle.
 *
 * It reads views from the ViewManager (the model) and reacts to its events; the manager
 * knows nothing about serving. AppCore owns both and wires them.
 */
export class ViewServer {
  private _logger = new Logger(["VIEW", "SERVER"]);
  private _client = new BlockViewClient();

  // Open SSE connections per view, so a config change pushes to just that view's watchers.
  private _streamSubs: Map<ViewKey, Set<SseConnection>> = new Map();

  constructor(private readonly _views: ViewManager) {
    // React to model changes: push new config to block-view watchers, drop watchers on removal.
    this._views.on("view_updated", (key) => this._refreshStreams(key));
    this._views.on("view_removed", (key) => this._closeStreams(key)); // TODO: Handle a deleted view better. Redirect to default?
  }

  /** Build the browser renderer bundle once (block views 503 until it succeeds). */
  async init(): Promise<void> {
    await this._client.build();
  }

  /** Register the /view/:key serving + config-stream routes and the client bundle. Call before start(). */
  registerRoutes(registrar: RouteRegistrar): void {
    const base = this._views.getRouteBase();
    registrar.registerRoute("get", `${base}/:key`, (req) => this._serveView(req));
    registrar.registerSse(`${base}/:key/stream`, (req, conn) => this._openStream(req, conn));
    registrar.registerRoute("get", VIEW_CLIENT_BUNDLE_PATH, () => this._serveBundle());
    // Same no-cache reasoning as the bundle: fixed path, may change across restarts.
    registrar.registerRoute("get", VIEW_CLIENT_STYLE_PATH, () => ({
      contentType: "text/css",
      body: this._client.getStylesheet(),
      headers: { "Cache-Control": "no-cache" },
    }));
    this._logger.info(`Registered view routes "${base}/:key(/stream)" + client bundle and stylesheet.`);
  }

  private _serveView(req: RouteRequest): RouteResponse {
    const view = this._views.getView(req.params.key);
    if (!view) return { status: 404 };

    const result = view.serve();
    if (result.kind === "redirect") return { redirect: result.url };

    // kind === "blocks": rendered client-side. Serve the host page that boots the renderer;
    // the client reads the view key from the path and streams the block config over SSE.
    return { body: this._client.getHostHtml(), contentType: "text/html" };
  }

  private _serveBundle(): RouteResponse {
    const bundle = this._client.getBundle();
    if (bundle === null) {
      return { status: 503, contentType: "text/plain", body: "View client bundle unavailable (build failed)." };
    }
    // Fixed, unhashed path: revalidate so a restart with new code isn't served stale from cache.
    return { contentType: "text/javascript", body: bundle, headers: { "Cache-Control": "no-cache" } };
  }

  /** The config payload a stream sends for a view, or null if it isn't a (renderable) block view. */
  private _blockConfigJson(key: ViewKey): string | null {
    const result = this._views.getView(key)?.serve();
    return result?.kind === "blocks" ? JSON.stringify(result.root) : null;
  }

  /** A client opened a view's config stream: seed with the current config, then subscribe. */
  private _openStream(req: RouteRequest, conn: SseConnection): void {
    const key = req.params.key;
    const payload = this._blockConfigJson(key);
    if (payload === null) {
      // Only block views stream a config (url views redirect; unknown keys have nothing).
      conn.send("gone", "");
      conn.close();
      return;
    }

    conn.send("config", payload); // seed the initial render

    let subs = this._streamSubs.get(key);
    if (!subs) {
      subs = new Set();
      this._streamSubs.set(key, subs);
    }
    subs.add(conn);
    conn.onClose(() => {
      const set = this._streamSubs.get(key);
      set?.delete(conn);
      if (set && set.size === 0) this._streamSubs.delete(key);
    });
  }

  /** Push a view's current config to its stream watchers, or close them if it's no longer a block view. */
  private _refreshStreams(key: ViewKey): void {
    const subs = this._streamSubs.get(key);
    if (!subs?.size) return;

    const payload = this._blockConfigJson(key);
    if (payload === null) {
      this._closeStreams(key); // type changed away from blocks, or view gone
      return;
    }
    for (const conn of subs) conn.send("config", payload);
  }

  /** Tell a view's stream watchers it's gone and end their connections. */
  private _closeStreams(key: ViewKey): void {
    const subs = this._streamSubs.get(key);
    if (!subs) return;
    for (const conn of subs) {
      conn.send("gone", "");
      conn.close();
    }
    this._streamSubs.delete(key);
  }
}
