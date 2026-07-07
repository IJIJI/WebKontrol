import { Logger } from "../../logging/Logger";
import { SystemRuntimeSchema, type SystemRuntime } from "../../system/schema";
import { CoreDatabase } from "../CoreDatabase";

export class SystemStore {
  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor() {
    this._logger = new Logger(["STORE", "SYSTEM"]);
    this._logger.debug(`Constructed store.`);
  }

  public async saveRuntime(config: SystemRuntime): Promise<void> {
    this._logger.debug(`Saving runtime...`);
    await this._db.updateSetting(
      "app",
      "system",
      "runtime",
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved runtime!`);
  }

  public async loadRuntime(): Promise<SystemRuntime | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("app", "system", "runtime");
      if (raw === null) {
        this._logger.info(`Failed loading runtime! Got null`);
        return null;
      }
      const object = SystemRuntimeSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(`Failed loading runtime with error:`, error);
      return null;
    }
  }
}
