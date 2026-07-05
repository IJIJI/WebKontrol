import { Logger } from "../logging/Logger";
import { UiRuntimeConfigSchema, type UiRuntimeConfig, type UiRuntimeConfigInput } from "../types/UiTypes";
import { CoreDatabase } from "./CoreDatabase";

export class UiStore {

  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor() {
    this._logger = new Logger(["STORE", "UI"]);
    this._logger.debug(`Constructed store.`);
  }

  public async saveRuntime(config: UiRuntimeConfig): Promise<void> {
    this._logger.debug(`Saving runtime...`);
    await this._db.updateSetting(
      "app",
      "ui",
      "runtime",
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved runtime!`);
  }

  public async loadRuntime(): Promise<UiRuntimeConfig | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("app", "ui", "runtime");
      if (raw === null) {
        this._logger.error(`Failed loading runtime! Got null`);
        return null;
      }
      const object = UiRuntimeConfigSchema.parse(JSON.parse(raw));
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
