import EventEmitter from "node:events";
import { Logger } from "../../logging/Logger";
import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import { BLANK_PUPPET_TARGET, type BasePuppetConfig, type PuppetKey, type PuppetRuntime } from "../../puppet/types/schema";
import type { PuppetWebhandlers } from "../../webServer/model";
import type { PuppetDataBundle, PuppetInfo } from "../../puppet/types/model";
import { PuppetOrchestratorStore } from "../../storage/stores/PuppetOrchestratorStore";
import { PuppetOrchestratorRuntimeSchema, type PuppetOrchestratorRuntime } from "./schema";


export type PuppetOrchestratorEvents = {
  puppet_update: [bundles: PuppetDataBundle[]];
  runtime_update: [runtime: PuppetOrchestratorRuntime];
}


interface PuppetFullBundle extends PuppetDataBundle {
  puppet: AbstractPuppet;
}



export class PuppetOrchestrator extends EventEmitter<PuppetOrchestratorEvents>  { // TODO: Add store and manage default runtime?
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  protected _store!: PuppetOrchestratorStore;
  protected _runtime: PuppetOrchestratorRuntime = PuppetOrchestratorRuntimeSchema.parse({});

  private _hasStarted: boolean = false;

  private _puppets: Map<PuppetKey, PuppetFullBundle> = new Map();

  constructor() {
    super();
  }


  getRuntime(): PuppetOrchestratorRuntime {
    return this._runtime;
  }

  getPuppetBundles(): PuppetDataBundle[] {
    return this._puppets.values().map((bundle) => { 
      return {
        info: bundle.info,
        runtime: bundle.runtime,
        config: bundle.config, 
      }
    }).toArray()
  }

  async updateRuntime(runtime: Partial<PuppetOrchestratorRuntime>): Promise<void> { // TODO: Add a way to set puppets to the default runtime -> there needs to be a way to know if puppets are set.
    this._runtime = {...this._runtime, ...runtime};
    this.emit('runtime_update', this.getRuntime());
    await this._store.saveRuntime(this._runtime);
  }

  private _updatePuppetData(id: PuppetKey, data: Partial<PuppetDataBundle>): void {
    const prev = this._puppets.get(id);
    if (!prev){
      this._logger.warn("Tried updating data cache for puppet that does not exist! Discarding.");
      return;
    }
    
    this._puppets.set(id, {...prev, ...data});
    this.emit('puppet_update', this.getPuppetBundles());
  }

  public addPuppet(puppet: AbstractPuppet): void {
    if (this._hasStarted)
      return this._logger.error("Cannot add puppets to PuppetManager after it has started!");

    const config = puppet.getConfig();
    const id = config.id;

    puppet.on('runtime_update', (runtime) => this._updatePuppetData(id, {runtime}));
    puppet.on('info_update', (info) => this._updatePuppetData(id, {info}));
    puppet.on('config_update', (config) => this._updatePuppetData(id, {config}));

    const pupBundle: PuppetFullBundle = {
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

    this._store = new PuppetOrchestratorStore();
    const runtime = await this._store.loadRuntime(); // TODO: All fields have defaults. Will this ever be null, store uses the schema to parse.
    if (runtime) {
      this._runtime = runtime;
    }
    else {
      this._logger.debug("No runtime found, using defaults.");
    }


    this._puppets.forEach(async (puppetBundle, key) => {
      await puppetBundle.puppet.init();
    });
  }

  public getHandlers(): PuppetWebhandlers {
    return {
      updateOrchestratorRuntime: (runtime: Partial<PuppetOrchestratorRuntime>) => this.updateRuntime(runtime),
      updateRuntime: (id: PuppetKey, runtime: Partial<PuppetRuntime>) => this.updatePuppetRuntime(id, runtime),
    }
  }
}
