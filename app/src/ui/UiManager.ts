import EventEmitter from "node:events";
import { UiStore } from "../storage/stores/UiStore";
import { UiRuntimeSchema, type UiRuntime } from "./schema";
import { Logger } from "../logging/Logger";
import type { UiWebhandlers } from "../webServer/model";

export type UiManagerEvents = {
  runtime_update: [runtime: UiRuntime],
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

  async init(): Promise<void> {

    const loaded = await this._store.loadRuntime();
    if (loaded)
      this._runtime = loaded;
    else
      this._logger.warn("Failed loading runtime from store, using defaults.");

    await this.updateRuntime(this._runtime); // TODO: Should this save?
  }

  async updateRuntime(runtime: Partial<UiRuntime>): Promise<void> {
    this._runtime = {...this._runtime, ...runtime};
    this.emit('runtime_update', this._runtime);
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