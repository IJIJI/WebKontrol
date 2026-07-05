import { Logger } from "../../logging/Logger";
import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import type { PuppetKey, PuppetRuntimeConfig } from "../../puppet/schema";


export class PuppetManager { // TODO: Make this manage the puppets, remove the rest from appcore
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _hasStarted: boolean = false;

  private _puppets: Map<PuppetKey, AbstractPuppet> = new Map();

  public addPuppet(puppet: AbstractPuppet): void {
    if (this._hasStarted)
      return this._logger.error("Cannot add puppets to PuppetManager after it has started!");

    //TODO: Event hooks!

    this._puppets.set(puppet.getKey(), puppet);
  }

  public setPuppetRuntime(key: PuppetKey, runtime: PuppetRuntimeConfig): void {
    if (!this._puppets.has(key))
      return this._logger.error(`Attempted to update runtime for puppet ${key}. It does not exist. Provided runtime:`, runtime);

    this._puppets.get(key)?.updateRuntime(runtime);
  }

  public async init(): Promise<void> {
    if (this._hasStarted)
      return this._logger.error("Attempted to initialised, but is already started!");

    this._puppets.forEach(async (puppet, key) => {
      await puppet.init();
    });
  }
}
