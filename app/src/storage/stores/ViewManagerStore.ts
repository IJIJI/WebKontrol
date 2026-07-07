import { Logger } from "../../logging/Logger";
import type {
  AbstractView,
  ViewConfig,
  ViewKey,
} from "../../views/types/AbstractView";
import { CoreDatabase } from "../CoreDatabase";

export class ViewManagerStore {
  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor() {
    this._logger = new Logger(["STORE", "VIEWMANAGER"]);
    this._logger.debug(`Constructed store.`);
  }

  // public async saveRuntime(config: SystemConfig): Promise<void> {
  //   this._logger.debug(`Saving runtime...`);
  //   await this._db.updateSetting(
  //     "app",
  //     "viewmanager",
  //     "runtime",
  //     JSON.stringify(config),
  //   );
  //   this._logger.debug(`Successfully saved runtime!`);
  // }

  // public async loadRuntime(): Promise<SystemConfig | null> {
  //   try {
  //     this._logger.debug(`Loading runtime...`);
  //     const raw = await this._db.getSetting("app", "viewmanager", "runtime");
  //     if (raw === null) {
  //       this._logger.info(`Failed loading runtime! Got null`);
  //       return null;
  //     }
  //     const object = SystemConfigSchema.parse(JSON.parse(raw));
  //     this._logger.debug(`Successfully loaded runtime!`, object);
  //     return object;
  //   } catch (error) {
  //     this._logger.error(
  //       `Failed loading runtime with error:`,
  //       error,
  //     );
  //     return null;
  //   }
  // }

  public async getViews(): Promise<Map<ViewKey, AbstractView>> {
    this._logger.debug(`Loading views...`);
    return new Map();
  }

  public async updateView(config: ViewConfig): Promise<void> {}
}
