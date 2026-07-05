import { UiStore } from "../storage/UiStore";
import { UiTheme, type UiRuntimeConfig } from "./schema";
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
    this._store = new UiStore();
  }

  async init() {
    
    const loaded = await this._store.loadRuntime();
    if (loaded)
      this._config = loaded;
    else
      this._logger.warn("Failed loading runtime from store, using defaults.");
  }

  async updateRuntime(config: Partial<UiRuntimeConfig>): Promise<void> {
    
    this._config = {...this._config, ...config};
    
    await this._store.saveRuntime(this._config);
  }

  getRuntime(): UiRuntimeConfig {
    return this._config;
  }
}