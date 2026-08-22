import { Logger } from "../../logging/Logger";
import { PuppetOrchestratorRuntimeSchema, type PuppetOrchestratorRuntime } from "../../orchestration/puppet/schema";
import { CoreDatabase } from "../CoreDatabase";

// TODO: Make a generic runtime store? Most functions are the same.
export class PuppetOrchestratorStore {
  private _db = CoreDatabase.getInstance();
  private _logger: Logger;

  constructor() {
    this._logger = new Logger(["STORE", "PUPPET", "ORCHESTRATOR"]);
    this._logger.debug(`Constructed store.`);
  }

  public async saveRuntime(config: PuppetOrchestratorRuntime): Promise<void> {
    this._logger.debug(`Saving runtime...`);
    await this._db.updateSetting(
      "app",
      "puppet_orchestrator",
      "runtime",
      JSON.stringify(config),
    );
    this._logger.debug(`Successfully saved runtime!`);
  }

  public async loadRuntime(): Promise<PuppetOrchestratorRuntime | null> {
    try {
      this._logger.debug(`Loading runtime...`);
      const raw = await this._db.getSetting("app", "puppet_orchestrator", "runtime");
      if (raw === null) {
        this._logger.debug(`No runtime saved yet; using defaults.`);
        return null;
      }
      const object = PuppetOrchestratorRuntimeSchema.parse(JSON.parse(raw));
      this._logger.debug(`Successfully loaded runtime!`, object);
      return object;
    } catch (error) {
      this._logger.error(`Failed loading runtime with error:`, error);
      return null;
    }
  }
}
