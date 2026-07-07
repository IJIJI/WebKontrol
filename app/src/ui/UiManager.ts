import EventEmitter from "node:events";
import { UiStore } from "../storage/stores/UiStore";
import { UiRuntimeSchema, type UiRuntime } from "./schema";
import { Logger } from "../logging/Logger";
import type { UiWebhandlers } from "../webServer/model";

export type UiManagerEvents = {
  info_update: [], // TODO: Should info be included in the event?
}

export class UiManager extends EventEmitter<UiManagerEvents>  {
  private _store: UiStore;
  private _logger: Logger;

  private _runtime: UiRuntime = UiRuntimeSchema.parse({});

  constructor() {
    super();
    this._logger = new Logger(["UI"]);
    this._store = new UiStore();
  }

  async init() {
    
    const loaded = await this._store.loadRuntime();
    if (loaded)
      this._runtime = loaded;
    else
      this._logger.warn("Failed loading runtime from store, using defaults.");
  }

  async updateRuntime(config: Partial<UiRuntime>): Promise<void> {
    
    this._runtime = {...this._runtime, ...config};
    
    this.emit('info_update');
    await this._store.saveRuntime(this._runtime);
  }

  getRuntime(): UiRuntime {
    return this._runtime;
  }

  public getHandlers(): UiWebhandlers {
    return {
      updateRuntime: (config: Partial<UiRuntime>) => this.updateRuntime(config),
    }
  }
}