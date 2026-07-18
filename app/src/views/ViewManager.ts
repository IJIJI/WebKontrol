import EventEmitter from "node:events";
import type { AbstractView } from "./views/AbstractView";
import {
  AnyViewConfigSchema,
  ViewManagerConfigSchema,
  ViewManagerRuntimeSchema,
  generateViewKey,
  type AnyViewConfig,
  type ViewKey,
  type ViewManagerConfig,
  type ViewManagerConfigInput,
  type ViewManagerRuntime,
} from "./types/schema";
import type { ViewManagerInfo } from "./types/model";
import type { RouteRegistrar, RouteRequest, RouteResponse, SseConnection } from "../webServer/model";
import { ViewManagerStore } from "../storage/stores/ViewManagerStore";
import { ViewFactory } from "./ViewFactory";
import { ViewClient } from "./client/ViewClient";
import { Logger } from "../logging/Logger";

// Fixed path the host page loads the browser bundle from. Kept out of the route base
// (a single segment under it would collide with /:key), and referenced by client/index.html.
const VIEW_CLIENT_BUNDLE_PATH = "/viewclient/main.js";

export type ViewManagerEvents = {
  view_added: [key: ViewKey];
  view_updated: [key: ViewKey];
  view_removed: [key: ViewKey];
  info_update: [info: ViewManagerInfo];
  runtime_update: [runtime: ViewManagerRuntime];
};

export class ViewManager extends EventEmitter<ViewManagerEvents> {
  private _logger: Logger;
  private _store: ViewManagerStore;

  private _runtime: ViewManagerRuntime = ViewManagerRuntimeSchema.parse({});

  private _info: ViewManagerInfo = {
    viewCount: 0,
  };

  private _views: Map<ViewKey, AbstractView> = new Map();

  // Open SSE connections per view, so a config change pushes to just that view's watchers.
  private _streamSubs: Map<ViewKey, Set<SseConnection>> = new Map();

  // The browser renderer app (host page + bundle), served at VIEW_CLIENT_BUNDLE_PATH.
  private _client = new ViewClient();

  private readonly _config: ViewManagerConfig;

  constructor(config: ViewManagerConfigInput) {
    super();
    this._config = ViewManagerConfigSchema.parse(config);
    this._logger = new Logger(["VIEW", "MANAGER"]);
    this._store = new ViewManagerStore();
  }

  /** The route path for a view: `${route_base}/${key}`. The express route and puppet target derive from this. */
  viewPath(key: ViewKey): string {
    return `${this._config.route_base}/${key}`;
  }

  /** Register the /view/:key serving + config-stream routes. Call before the server starts. */
  registerRoutes(registrar: RouteRegistrar): void {
    registrar.registerRoute("get", `${this._config.route_base}/:key`, (req) => this._serve(req));
    registrar.registerSse(`${this._config.route_base}/:key/stream`, (req, conn) => this._openStream(req, conn));
    registrar.registerRoute("get", VIEW_CLIENT_BUNDLE_PATH, () => this._serveBundle());
    this._logger.info(`Registered view routes "${this._config.route_base}/:key(/stream)" + client bundle.`);
  }

  private _serveBundle(): RouteResponse {
    const bundle = this._client.getBundle();
    if (bundle === null) {
      return { status: 503, contentType: "text/plain", body: "View client bundle unavailable (build failed)." };
    }
    // Fixed, unhashed path: revalidate so a restart with new code isn't served stale from cache.
    return { contentType: "text/javascript", body: bundle, headers: { "Cache-Control": "no-cache" } };
  }

  private _serve(req: RouteRequest): RouteResponse {
    const view = this._views.get(req.params.key);
    if (!view) return { status: 404 };

    const result = view.serve();
    if (result.kind === "redirect") return { redirect: result.url };

    // kind === "blocks": the view renders client-side. Serve the host page that boots
    // the renderer; the client reads the view key from the path and streams the block
    // config over SSE.
    return { body: this._client.getHostHtml(), contentType: "text/html" };
  }

  /** The config payload a stream sends for a view, or null if it isn't a (renderable) block view. */
  private _blockConfigJson(key: ViewKey): string | null {
    const result = this._views.get(key)?.serve();
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

  async init(): Promise<void> {
    const loadedRuntime = await this._store.loadRuntime();
    if (loadedRuntime)
      this._runtime = loadedRuntime;
    else
      this._logger.info("Failed loading runtime from store, using defaults.");

    const configs = await this._store.getViews();
    for (const [key, config] of configs) {
      this._views.set(key, ViewFactory.createView(key, config)); // TODO: Views are stored again. Smart?
    }
    this._logger.info(`Loaded ${this._views.size} view(s).`);
    this._syncInfo();

    // Build the browser renderer bundle once (block views 503 until it succeeds).
    await this._client.build();
  }

  getView(key: ViewKey): AbstractView | undefined {
    return this._views.get(key);
  }

  listViews(): AbstractView[] {
    return [...this._views.values()];
  }

  getRuntime(): ViewManagerRuntime {
    return this._runtime;
  }

  getDefaultLoadTimeout(): number {
    return this._runtime.default_load_timeout;
  }

  getInfo(): ViewManagerInfo {
    return this._info;
  }

  async createView(config: AnyViewConfig): Promise<ViewKey> {
    const parsed = AnyViewConfigSchema.parse(config);
    const key = generateViewKey(this._views.keys());
    await this._store.updateView(key, parsed);
    this._views.set(key, ViewFactory.createView(key, parsed));
    this._syncInfo();
    this.emit("view_added", key);
    this._logger.info(`Created view "${key}".`);
    return key;
  }

  async updateView(key: ViewKey, config: AnyViewConfig): Promise<void> {
    if (!this._views.has(key)) throw new Error(`No view with key "${key}".`);
    const parsed = AnyViewConfigSchema.parse(config);
    await this._store.updateView(key, parsed);
    // Re-instantiate rather than mutate: cleanly handles a view type change.
    this._views.set(key, ViewFactory.createView(key, parsed));
    this.emit("view_updated", key);
    this._refreshStreams(key); // push the new config to open viewers, in place
    this._logger.info(`Updated view "${key}".`);
  }

  async deleteView(key: ViewKey): Promise<void> {
    if (!this._views.has(key)) throw new Error(`No view with key "${key}".`);
    await this._store.deleteView(key);
    this._views.delete(key);
    this._closeStreams(key); // end open viewers before they lose their view
    this._syncInfo();
    this.emit("view_removed", key);
    this._logger.info(`Deleted view "${key}".`);
  }

  async updateRuntime(runtime: Partial<ViewManagerRuntime>): Promise<void> {
    this._runtime = { ...this._runtime, ...runtime };
    this.emit("runtime_update", this._runtime);
    await this._store.saveRuntime(this._runtime);
  }

  private _syncInfo(): void {
    this._info = { ...this._info, viewCount: this._views.size };
    this.emit("info_update", this._info);
  }
}
