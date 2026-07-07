import { Logger } from "../../logging/Logger";
import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import type { PuppetKey } from "../../puppet/schema.old";
import type { PuppetRuntime } from "../../puppet/types/schema";
import type { PuppetWebhandlers } from "../../webServer/model";


export class PuppetOrchestrator { // TODO: Make this manage the puppets, remove the rest from appcore
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _hasStarted: boolean = false;

  private _puppets: Map<PuppetKey, AbstractPuppet> = new Map();

  public addPuppet(puppet: AbstractPuppet): void {
    if (this._hasStarted)
      return this._logger.error("Cannot add puppets to PuppetManager after it has started!");

    //TODO: Event hooks!

    this._puppets.set(puppet.getKey(), puppet);
  }

  public async updatePuppetRuntime(id: PuppetKey, runtime: Partial<PuppetRuntime>): Promise<void> {
    if (!this._puppets.has(id))
      return this._logger.error(`Attempted to update runtime for puppet ${id}. It does not exist. Provided runtime:`, runtime);

    await this._puppets.get(id)?.updateRuntime(runtime);
  }

  public async init(): Promise<void> {
    if (this._hasStarted)
      return this._logger.error("Attempted to initialised, but is already started!");

    this._puppets.forEach(async (puppet, key) => {
      await puppet.init();
    });
  }

  public getHandlers(): PuppetWebhandlers {
    return {
      updateRuntime: this.updatePuppetRuntime,
    }
  }
}
