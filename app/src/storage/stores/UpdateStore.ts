import { Logger } from "../../logging/Logger";
import { UpdateJournalSchema, type UpdateJournalEntry } from "../../system/update/schema";
import { CoreDatabase } from "../CoreDatabase";

export class UpdateStore {
  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor() {
    this._logger = new Logger(["STORE", "UPDATE"]);
    this._logger.debug(`Constructed store.`);
  }

  public async saveJournal(entry: UpdateJournalEntry): Promise<void> {
    await this._db.updateSetting("app", "update", "journal", JSON.stringify(entry));
  }

  public async loadJournal(): Promise<UpdateJournalEntry | null> {
    try {
      const raw = await this._db.getSetting("app", "update", "journal");
      if (raw === null) return null; // no update has ever run; not an error
      return UpdateJournalSchema.parse(JSON.parse(raw));
    } catch (error) {
      this._logger.error(`Failed loading the update journal:`, error);
      return null;
    }
  }
}
