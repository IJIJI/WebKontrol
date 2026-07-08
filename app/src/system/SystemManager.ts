
import EventEmitter from "node:events";
import { Logger } from "../logging/Logger";
import { SystemStore } from "../storage/stores/SystemStore";
import type { SystemWebhandlers } from "../webServer/model";
import type { SystemInfo } from "./model";
import { SystemRuntimeSchema, type SystemRuntime } from "./schema";

export type SystemManagerEvents = {
  info_update: [info: SystemInfo],
  runtime_update: [runtime: SystemRuntime],
}

export class SystemManager extends EventEmitter<SystemManagerEvents>  {
  private _logger: Logger;
  private _store: SystemStore;

  private _runtime: SystemRuntime = SystemRuntimeSchema.parse({});

  private _info: SystemInfo = { 
    start_moment: Date.now() 
  };

  constructor() {
    super();
    this._logger = new Logger(["SYSTEM"]);
    this._store = new SystemStore();
  }

  async init() {
    
    const loaded = await this._store.loadRuntime();
    if (loaded)
      this._runtime = loaded;
    else
      this._logger.info("Failed loading runtime from store, using defaults.");
    
    await this.updateRuntime(this._runtime); // TODO: Should this save?
  }

  async updateRuntime(runtime: Partial<SystemRuntime>): Promise<void> {
    this._runtime = {...this._runtime, ...runtime};
    this.emit('runtime_update', this._runtime);
    await this._store.saveRuntime(this._runtime);
  }
  async updateInfo(info: Partial<SystemInfo>): Promise<void> {
    this._info = {...this._info, ...info};
    this.emit('info_update', this._info);
  }

  getRuntime(): SystemRuntime {
    return this._runtime;
  }
  getInfo(): SystemInfo {
    return this._info;
  }

  public getHandlers(): SystemWebhandlers {
    return {
      updateRuntime: (config: Partial<SystemRuntime>) => this.updateRuntime(config),
    }
  }
}