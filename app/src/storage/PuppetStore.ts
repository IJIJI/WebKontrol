import { Logger } from "../logging/Logger";
import { PuppetRuntimeSchema, type PuppetKey, type PuppetRuntime } from "../puppet/types/schema";
import { CoreDatabase } from "./CoreDatabase";

export class PuppetStore {
  private _id: PuppetKey;

  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  private static _default_runtime: PuppetRuntime;

  public static setDefualtRuntime(runtime: PuppetRuntime): void {
    this._default_runtime = runtime;
  }

  private static get _getDefaultRuntime(): PuppetRuntime {
    if (!this._default_runtime) { // TODO: Should this check happen on construction and not here?
      throw new Error("Default runtime was not set!");
    }
    return this._default_runtime;
  }

  constructor(id: string) {
    this._id = id;
    this._logger = new Logger(["STORE", "PUPPET", id]);
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

  public async loadRuntime(): Promise<PuppetRuntime> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("puppet", this._id, "runtime");
      if (raw === null) {
        this._logger.error(`Failed loading runtime! Returning default`);
        return PuppetStore._getDefaultRuntime;
      }
      const object = PuppetRuntimeSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(
        `Failed loading runtime for puppet ${this._id} with error:`,
        error,
        `Returning default.`
      );
      return PuppetStore._getDefaultRuntime;
    }
  }

  public async clearRuntime(): Promise<void> {
    this._db.deleteSetting("puppet", this._id, "runtime");
  }
}
