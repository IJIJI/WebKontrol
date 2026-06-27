import type { ZodType } from "zod";
import { Logger } from "../logging/Logger";
import type { PuppetKey, PuppetRuntimeConfig } from "../puppet/schema";
import { CoreDatabase } from "./CoreDatabase";



export class PuppetStore<T extends PuppetRuntimeConfig = PuppetRuntimeConfig> {
  private _id: PuppetKey;
  private _schema: ZodType<T>;
  
  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor(id: string, schema: ZodType<T>) {
    this._id = id;
    this._schema = schema;
    this._logger = new Logger(["STORE", "PUPPET", id]);
    this._logger.debug(`Constructed runtime.`);
  }

  public async saveRuntime(config: T): Promise<void> {
    this._logger.debug(`Saving runtime...`);
    await this._db.updateSetting("puppet", this._id, "runtime", JSON.stringify(config));
    this._logger.debug(`Successfully saved runtime!`);
  }

  public async loadRuntime(): Promise<T | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("puppet", this._id, "runtime");
      if (raw === null) {
        this._logger.error(`Failed loading runtime! Got null`)
        return null;
      }
      const object = this._schema.parse(JSON.parse(raw))
      this._logger.debug(`Successfully loaded runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(`Failed loading runtime for puppet ${this._id} with error:`, error);
      return null;
    }
  }
}