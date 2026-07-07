
import { Logger } from "../logging/Logger";
import { SystemStore } from "../storage/stores/SystemStore";
import type { SystemWebhandlers } from "../webServer/model";
import type { SystemInfo } from "./model";
import { SystemRuntimeSchema, type SystemRuntime } from "./schema";


export class SystemManager {
  private _logger: Logger;
  private _store: SystemStore;

  private _config: SystemRuntime = SystemRuntimeSchema.parse({});

  private _info: SystemInfo = { 
    start_moment: Date.now() 
  }; // computed, never persisted

  constructor() {
    this._logger = new Logger(["SYSTEM"]);
    this._store = new SystemStore();
  }

  async init() {
    
    const loaded = await this._store.loadRuntime();
    if (loaded)
      this._config = loaded;
    else
      this._logger.warn("Failed loading runtime from store, using defaults.");
  }

  async updateRuntime(config: Partial<SystemRuntime>): Promise<void> {
    
    this._config = {...this._config, ...config};
    
    await this._store.saveRuntime(this._config);
  }

  getRuntime(): SystemRuntime {
    return this._config;
  }
  getInfo(): SystemInfo {
    return this._info;
  }

  public getHandlers(): SystemWebhandlers {
    return {
      updateRuntime: this.updateRuntime,
    }
  }
}