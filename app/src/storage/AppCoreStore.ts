import { Logger } from "../logging/Logger";
import { SystemConfigSchema, type SystemConfig } from "../system/schema";
import { CoreDatabase } from "./CoreDatabase";

export class AppCoreStore {

  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor() {
    this._logger = new Logger(["STORE", "CORE"]);
    this._logger.debug(`Constructed store.`);
  }

  public async saveRuntime(config: SystemConfig): Promise<void> {
    this._logger.debug(`Saving runtime...`);
    await this._db.updateSetting(
      "app",
      "core",
      "runtime",
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved runtime!`);
  }

  public async loadRuntime(): Promise<SystemConfig | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("app", "core", "runtime");
      if (raw === null) {
        this._logger.info(`Failed loading runtime! Got null`);
        return null;
      }
      const object = SystemConfigSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(
        `Failed loading runtime with error:`,
        error,
      );
      return null;
    }
  }
}
