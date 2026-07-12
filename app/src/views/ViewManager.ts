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

    const loaded = await this._store.loadRuntime();
    if (loaded)
      this._runtime = loaded;
    else
      this._logger.info("Failed loading runtime from store, using defaults.");
    
    await this.updateRuntime(this._runtime); // TODO: Should this save?
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
