
import { Logger } from "../logging/Logger";
import { SystemStore } from "../storage/stores/SystemStore";
import type { SystemWebhandlers } from "../webServer/model";
import type { SystemInfo } from "./model";
import { SystemRuntimeSchema, type SystemRuntime } from "./schema";


export class SystemManager {
  private _logger: Logger;
  private _store: SystemStore;

  private _runtime: SystemRuntime = SystemRuntimeSchema.parse({});

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
      this._runtime = loaded;
    else {
      this._logger.info("Failed loading runtime from store, using defaults.");
      await this._store.saveRuntime(this._runtime); // TODO: Should this save?
    }
  }

  async updateRuntime(config: Partial<SystemRuntime>): Promise<void> {
    
    this._runtime = {...this._runtime, ...config};
    
    await this._store.saveRuntime(this._runtime);
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