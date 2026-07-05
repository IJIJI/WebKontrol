import { Logger } from "../logging/Logger";
import { UiRuntimeConfigSchema, type UiRuntimeConfig, type UiRuntimeConfigInput } from "../types/UiTypes";
import { CoreDatabase } from "./CoreDatabase";

export class WebServerStore {
  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor() {
    this._logger = new Logger(["STORE", "WEBSERVER"]);
    this._logger.debug(`Constructed store.`);
  }

  public async updateUiRuntime(config: UiRuntimeConfig): Promise<void> {
    await this._db.updateSetting(
      "web",
      "ui",
      "runtime",
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved UI runtime!`);
  }

  public async getUiRuntime(): Promise<UiRuntimeConfig | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("web", "ui", "runtime");
      if (raw === null) {
        this._logger.error(`Failed loading UI runtime! Got null`);
        return null;
      }
      const object = UiRuntimeConfigSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded UI runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(
        `Failed loading UI runtime with error:`,
        error,
      );
      return null;
    }
  }

}
