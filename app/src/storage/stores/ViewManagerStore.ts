import { Logger } from "../../logging/Logger";
import {
  AnyViewConfigSchema,
  ViewManagerRuntimeSchema,
  type AnyViewConfig,
  type ViewKey,
  type ViewManagerRuntime,
} from "../../views/types/schema";
import { CoreDatabase } from "../CoreDatabase";


export class ViewManagerStore {
  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor() {
    this._logger = new Logger(["STORE", "VIEWMANAGER"]);
    this._logger.debug(`Constructed store.`);
  }
  
  public async saveRuntime(config: ViewManagerRuntime): Promise<void> {
    this._logger.debug(`Saving runtime...`);
    await this._db.updateSetting(
      "app",
      "viewmanager",
      "runtime",
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved runtime!`);
  }

  public async loadRuntime(): Promise<ViewManagerRuntime | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("app", "viewmanager", "runtime");
      if (raw === null) {
        this._logger.debug(`No runtime saved yet; using defaults.`);
        return null;
      }
      const object = ViewManagerRuntimeSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(`Failed loading runtime with error:`, error);
      return null;
    }
  }

  // TODO: deleteRuntime?


  public async getView(key: ViewKey): Promise<AnyViewConfig | null> {
    try {
      this._logger.debug(`Loading view "${key}"...`);
      const raw = await this._db.getSetting(
        "view",
        "entry",
        key,
      );
      if (raw === null) {
        this._logger.debug(`No view "${key}" in the store.`);
        return null;
      }
      const config = AnyViewConfigSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded view "${key}"!`, config);
      return config;
    } catch (error) {
      this._logger.error(`Failed loading view "${key}" with error:`, error);
      return null;
    }
  }

  public async getViews(): Promise<Map<ViewKey, AnyViewConfig>> {
    this._logger.debug(`Loading views...`);
    const rows = await this._db.getSettingsByType(
      "view",
      "entry",
    );
    const views = new Map<ViewKey, AnyViewConfig>();
    for (const [key, value] of rows) {
      try {
        views.set(key, AnyViewConfigSchema.parse(JSON.parse(value)));
      } catch (error) {
        this._logger.error(`Failed loading view "${key}" with error:`, error);
      }
    }
    this._logger.debug(`Successfully loaded ${views.size} view(s)!`);
    return views;
  }

  public async updateView(key: ViewKey, config: AnyViewConfig): Promise<void> {
    this._logger.debug(`Saving view "${key}"...`);
    await this._db.updateSetting(
      "view",
      "entry",
      key,
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved view "${key}"!`);
  }

  public async updateViews(views: Map<ViewKey, AnyViewConfig>): Promise<void> {
    this._logger.debug(`Saving ${views.size} view(s)...`);
    for (const [key, config] of views) {
      await this.updateView(key, config);
    }
    this._logger.debug(`Successfully saved views!`);
  }

  public async deleteView(key: ViewKey): Promise<void> {
    this._logger.debug(`Deleting view "${key}"...`);
    await this._db.deleteSetting("view", "entry", key);
    this._logger.debug(`Successfully deleted view "${key}"!`);
  }
}
