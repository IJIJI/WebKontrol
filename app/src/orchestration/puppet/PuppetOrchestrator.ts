import EventEmitter from "node:events";
import { Logger } from "../../logging/Logger";
import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import type { BasePuppetConfig, PuppetKey, PuppetRuntime } from "../../puppet/types/schema";
import type { PuppetWebhandlers } from "../../webServer/model";
import type { PuppetInfo } from "../../puppet/types/model";
import type { PuppetOrchestratorConfigOutput, PuppetOrchestratorInfoOutput, PuppetOrchestratorRuntimeOutput } from "./model";


export type PuppetOrchestratorEvents = {
  info_update: [info: PuppetOrchestratorInfoOutput];
  runtime_update: [runtime: PuppetOrchestratorRuntimeOutput];
  config_update: [config: PuppetOrchestratorConfigOutput];
}

interface PuppetDataBundle {
  puppet: AbstractPuppet;
  runtime: PuppetRuntime;
  info: PuppetInfo;
  config: BasePuppetConfig;
}



export class PuppetOrchestrator extends EventEmitter<PuppetOrchestratorEvents>  { // TODO: Add store and manage default runtime?
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _hasStarted: boolean = false;

  private _puppets: Map<PuppetKey, PuppetDataBundle> = new Map();

  constructor() {
    super();
  }

  getInfo(): PuppetOrchestratorInfoOutput {
    return {
      puppets: this._puppets.values().map((bundle) => bundle.info).toArray(),
    }
  }

  getRuntime(): PuppetOrchestratorRuntimeOutput {
    return {
      puppets: this._puppets.values().map((bundle) => bundle.runtime).toArray(),
    }
  }

  getConfig(): PuppetOrchestratorConfigOutput {
    return {
      puppets: this._puppets.values().map((bundle) => bundle.config).toArray(),
    }
  }

  private _updatePuppetData(id: PuppetKey, data: Partial<Omit<PuppetDataBundle, "puppet">>): void {
    const prev = this._puppets.get(id);
    if (!prev){
      this._logger.warn("Tried updating data cache for puppet that does not exist! Discarding.");
      return;
    }
    
    this._puppets.set(id, {...prev, ...data});
    
    if (data.info && prev.info !== data.info){
      this.emit('info_update', this.getInfo())
    }
    if (data.runtime && prev.runtime !== data.runtime){
      this.emit('runtime_update', this.getRuntime())
    }
    if (data.config && prev.config !== data.config){
      this.emit('config_update', this.getConfig())
    }
  }

  public addPuppet(puppet: AbstractPuppet): void {
    if (this._hasStarted)
      return this._logger.error("Cannot add puppets to PuppetManager after it has started!");

    const config = puppet.getConfig();
    const id = config.id;

    puppet.on('runtime_update', (runtime) => this._updatePuppetData(id, {runtime}));
    puppet.on('info_update', (info) => this._updatePuppetData(id, {info}));
    puppet.on('config_update', (config) => this._updatePuppetData(id, {config}));

    const pupBundle: PuppetDataBundle = {
      puppet: puppet,
      runtime: puppet.getRuntime(),
      info: puppet.getLastInfo(),
      config: config,
    }

    this._puppets.set(puppet.getKey(), pupBundle);
  }

  public async updatePuppetRuntime(id: PuppetKey, runtime: Partial<PuppetRuntime>): Promise<void> {
    if (!this._puppets.has(id))
      return this._logger.error(`Attempted to update runtime for puppet ${id}. It does not exist. Provided runtime:`, runtime);

    await this._puppets.get(id)?.puppet.updateRuntime(runtime);
  }

  public async init(): Promise<void> {
    if (this._hasStarted)
      return this._logger.error("Attempted to initialised, but is already started!");

    this._puppets.forEach(async (puppetBundle, key) => {
      await puppetBundle.puppet.init();
    });
  }

  public getHandlers(): PuppetWebhandlers {
    return {
      updateRuntime: (id, runtime) => this.updatePuppetRuntime(id, runtime),
    }
  }
}
