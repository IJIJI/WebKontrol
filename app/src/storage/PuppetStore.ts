import { Logger } from "../logging/Logger";
import {
  PuppetRuntimeConfigSchema,
  type PuppetKey,
  type PuppetRuntimeConfig,
} from "../puppet/schema";
import { CoreDatabase } from "./CoreDatabase";

export class PuppetStore {
  private _id: PuppetKey;

  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor(id: string) {
    this._id = id;
    this._logger = new Logger(["STORE", "PUPPET", id]);
    this._logger.debug(`Constructed runtime.`);
  }

  public async saveRuntime(config: PuppetRuntimeConfig): Promise<void> {
    this._logger.debug(`Saving runtime...`);
    await this._db.updateSetting(
      "puppet",
      this._id,
      "runtime",
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved runtime!`);
  }

  public async loadRuntime(): Promise<PuppetRuntimeConfig | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("puppet", this._id, "runtime");
      if (raw === null) {
        this._logger.error(`Failed loading runtime! Got null`);
        return null;
      }
      const object = PuppetRuntimeConfigSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(
        `Failed loading runtime for puppet ${this._id} with error:`,
        error,
      );
      return null;
    }
  }
}
