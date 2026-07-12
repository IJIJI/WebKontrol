import EventEmitter from "node:events";
import type { AbstractView } from "./views/AbstractView";
import {
  AnyViewConfigSchema,
  ViewManagerRuntimeSchema,
  generateViewKey,
  type AnyViewConfig,
  type ViewKey,
  type ViewManagerRuntime,
} from "./types/schema";
import type { ViewManagerInfo } from "./types/model";
import { ViewManagerStore } from "../storage/stores/ViewManagerStore";
import { ViewFactory } from "./ViewFactory";
import { Logger } from "../logging/Logger";

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

  constructor() {
    super();
    this._logger = new Logger(["VIEW", "MANAGER"]);
    this._store = new ViewManagerStore();
  }

  async init(): Promise<void> {
    const loadedRuntime = await this._store.loadRuntime();
    if (loadedRuntime)
      this._runtime = loadedRuntime;
    else
      this._logger.info("Failed loading runtime from store, using defaults.");
    await this.updateRuntime(this._runtime); // TODO: Should this save?

    const configs = await this._store.getViews();
    for (const [key, config] of configs) {
      this._views.set(key, ViewFactory.createView(key, config));
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

  getRuntime(): ViewManagerRuntime {
    return this._runtime;
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
    this._logger.info(`Updated view "${key}".`);
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
    this._runtime = {...this._runtime, ...runtime};
    this.emit('runtime_update', this._runtime);
    await this._store.saveRuntime(this._runtime);
  }
  async updateInfo(info: Partial<ViewManagerInfo>): Promise<void> {
    this._info = {...this._info, ...info};
    this.emit('info_update', this._info);
  }
}
