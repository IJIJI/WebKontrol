import { UiStore } from "../storage/stores/UiStore";
import { UiTheme, type UiRuntime } from "./schema";
import { Logger } from "../logging/Logger";
import type { UiWebhandlers } from "../webServer/model";


export class UiManager {
  private _store: UiStore;
  private _logger: Logger;

  private _config: UiRuntime = {
    theme: UiTheme.AUTO,
    disableBackground: false,
  }

  constructor() {
    this._logger = new Logger(["UI"]);
    this._store = new UiStore();
  }

  async init() {
    
    const loaded = await this._store.loadRuntime();
    if (loaded)
      this._config = loaded;
    else
      this._logger.warn("Failed loading runtime from store, using defaults.");
  }

  async updateRuntime(config: Partial<UiRuntime>): Promise<void> {
    
    this._config = {...this._config, ...config};
    
    await this._store.saveRuntime(this._config);
  }

  getRuntime(): UiRuntime {
    return this._config;
  }

  public getHandlers(): UiWebhandlers {
    return {
      updateRuntime: this.updateRuntime,
    }
  }
}