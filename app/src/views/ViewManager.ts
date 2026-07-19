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
import { ViewManagerStore } from "../storage/stores/ViewManagerStore";
import { ViewFactory } from "./ViewFactory";
import { Logger } from "../logging/Logger";

export type ViewManagerEvents = {
  view_added: [key: ViewKey];
  // puppetReload = the view's served target changed, so a showing puppet must re-navigate
  // (block content edits ride the SSE stream instead and leave this false).
  view_updated: [key: ViewKey, puppetReload: boolean];
  view_removed: [key: ViewKey];
  info_update: [info: ViewManagerInfo];
  runtime_update: [runtime: ViewManagerRuntime];
};

/**
 * The view collection (model): owns the views, their storage, and the runtime, and emits
 * lifecycle events. It knows nothing about HTTP — ViewServer serves views and the
 * orchestrator reacts to the events. AppCore owns both.
 */
export class ViewManager extends EventEmitter<ViewManagerEvents> {
  private _logger: Logger;
  private _store: ViewManagerStore;

  private _runtime: ViewManagerRuntime = ViewManagerRuntimeSchema.parse({});

  private _info: ViewManagerInfo = {
    viewCount: 0,
  };

  private _views: Map<ViewKey, AbstractView> = new Map();

  private readonly _config: ViewManagerConfig;

  constructor(config: ViewManagerConfigInput) {
    super();
    this._config = ViewManagerConfigSchema.parse(config);
    this._logger = new Logger(["VIEW", "MANAGER"]);
    this._store = new ViewManagerStore();
  }

  /** The route path for a view: `${route_base}/${key}`. The puppet target derives from this. */
  viewPath(key: ViewKey): string {
    return `${this._config.route_base}/${key}`;
  }

  /** The configured /view route prefix; ViewServer registers its routes under it. */
  getRouteBase(): string {
    return this._config.route_base;
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
  }

  getView(key: ViewKey): AbstractView | undefined {
    return this._views.get(key);
  }

  listViews(): AbstractView[] {
    return [...this._views.values()];
  }

  /** A serializable snapshot of every view's config, keyed by view key (for WebServerState.views). */
  getViewConfigs(): Record<ViewKey, AnyViewConfig> {
    return Object.fromEntries([...this._views].map(([key, view]) => [key, view.getConfig()]));
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
    const previous = this._views.get(key);
    if (!previous) throw new Error(`No view with key "${key}".`);
    const parsed = AnyViewConfigSchema.parse(config);
    await this._store.updateView(key, parsed);
    // Re-instantiate rather than mutate: one path also handles a view type change.
    const next = ViewFactory.createView(key, parsed);
    this._views.set(key, next);
    // A showing puppet only needs to re-navigate if the served target changed (see reloadSignature).
    const puppetReload = previous.reloadSignature() !== next.reloadSignature();
    this.emit("view_updated", key, puppetReload);
    this._logger.info(`Updated view "${key}" (puppet reload: ${puppetReload}).`);
  }

  async deleteView(key: ViewKey): Promise<void> {
    if (!this._views.has(key)) throw new Error(`No view with key "${key}".`);
    await this._store.deleteView(key);
    this._views.delete(key);
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
