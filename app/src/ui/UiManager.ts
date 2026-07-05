import { UiStore } from "../storage/UiStore";
import { UiTheme, type UiRuntimeConfig } from "../types/UiTypes";
import { Logger } from "../logging/Logger";


export class UiManager {
  private _store: UiStore;
  private _logger: Logger;

  private _config: UiRuntimeConfig = {
    theme: UiTheme.AUTO,
    disableBackground: false,
  }

  constructor() {
    this._logger = new Logger(["UI"]);
    this._store = new UiStore;
    
    this._store.loadRuntime()
      .then((loaded) => {
        if (loaded)
          this._config = loaded;
      })
      .catch((error) => {
        this._logger.warn("Failed loading runtime from store, using defaults. Current config:", this._config, "error:", error);
      });
  }

  async updateRuntime(config: Partial<UiRuntimeConfig>): Promise<void> {
    
    this._config = {...this._config, ...config};
    
    await this._store.saveRuntime(this._config);
  }

  getRuntime(): UiRuntimeConfig {
    return this._config;
  }
}