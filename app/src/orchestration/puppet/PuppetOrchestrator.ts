import EventEmitter from "node:events";
import { Logger } from "../../logging/Logger";
import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import type { PuppetInfoBundle } from "../../puppet/types/model";
import type { PuppetKey, PuppetRuntime } from "../../puppet/types/schema";
import type { PuppetWebhandlers } from "../../webServer/model";


export type PuppetOrchestratorEvents = {
  info_update: [], // TODO: Should info be included in the event?
}

export class PuppetOrchestrator extends EventEmitter<PuppetOrchestratorEvents>  { // TODO: Add store and manage default runtime?
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _hasStarted: boolean = false;

  private _puppets: Map<PuppetKey, AbstractPuppet> = new Map();

  constructor() {
    super();
  }
  
  private _updateInfo(): void { 
    this.emit("info_update");
  }

  public addPuppet(puppet: AbstractPuppet): void {
    if (this._hasStarted)
      return this._logger.error("Cannot add puppets to PuppetManager after it has started!");

    puppet.on('info_update', () => this._updateInfo());
    puppet.on('load_fail', () => this._updateInfo());
    puppet.on('load_success', () => this._updateInfo());
    puppet.on('runtime_update', () => this._updateInfo());

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
      updateRuntime: (id, runtime) => this.updatePuppetRuntime(id, runtime),
    }
  }

  public async getPuppetInfoBundles(): Promise<PuppetInfoBundle[]> {
    return await Promise.all(
        this._puppets
            .values()
            .map((puppet) => puppet.getInfo())
            .toArray()
    )
  }
}
