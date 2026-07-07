import { Logger } from "../../logging/Logger";
import { PuppetRuntimeSchema, type PuppetKey, type PuppetRuntime } from "../../puppet/types/schema";
import { CoreDatabase } from "../CoreDatabase";

// TODO: Make a generic runtime store? Most functions are the same.
export class PuppetStore {
  private _id: PuppetKey;

  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor(id: PuppetKey) {
    this._id = id;
    this._logger = new Logger(["STORE", "PUPPET", "ENTRY", id]);
    this._logger.debug(`Constructed store.`);
  }

  public async saveRuntime(config: PuppetRuntime): Promise<void> {
    this._logger.debug(`Saving runtime...`);
    await this._db.updateSetting(
      "puppet",
      this._id,
      "runtime",
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved runtime!`);
  }

  public async loadRuntime(): Promise<PuppetRuntime | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("puppet", this._id, "runtime");
      if (raw === null) {
        this._logger.error(`Failed loading runtime! Returning null`);
        return null;
      }
      const object = PuppetRuntimeSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(
        `Failed loading runtime for puppet ${this._id} with error:`,
        error,
        `Returning null.`
      );
      return null;
    }
  }

  public async clearRuntime(): Promise<void> {
    this._db.deleteSetting("puppet", this._id, "runtime");
  }
}
