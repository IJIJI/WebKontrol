import EventEmitter from "node:events";
import { Logger } from "../../logging/Logger";
import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import { BLANK_PUPPET_TARGET, type PuppetKey, type PuppetRuntime } from "../../puppet/types/schema";
import type { ViewKey } from "../../views/types/schema";
import type { ViewManager } from "../../views/ViewManager";
import type { PuppetWebhandlers } from "../../webServer/model";
import type { PuppetDataBundle } from "../../puppet/types/model";
import { PuppetOrchestratorStore } from "../../storage/stores/PuppetOrchestratorStore";
import { PuppetOrchestratorRuntimeSchema, type PuppetOrchestratorRuntime } from "./schema";


export type PuppetOrchestratorEvents = {
  puppet_update: [bundles: PuppetDataBundle[]];
  runtime_update: [runtime: PuppetOrchestratorRuntime];
}


interface PuppetFullBundle extends PuppetDataBundle {
  puppet: AbstractPuppet;
}



export class PuppetOrchestrator extends EventEmitter<PuppetOrchestratorEvents>  {
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  protected _store!: PuppetOrchestratorStore;
  protected _runtime: PuppetOrchestratorRuntime = PuppetOrchestratorRuntimeSchema.parse({});

  private _hasStarted: boolean = false;

  private _puppets: Map<PuppetKey, PuppetFullBundle> = new Map();

  private _viewManager?: ViewManager;
  private _serveBase: string = "";

  constructor() {
    super();
  }


  getRuntime(): PuppetOrchestratorRuntime {
    return this._runtime;
  }

  /** Give the orchestrator what it needs to resolve view assignments into puppet targets. */
  public setViewContext(viewManager: ViewManager, serveBase: string): void {
    this._viewManager = viewManager;
    this._serveBase = serveBase;
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

  async updateRuntime(runtime: Partial<PuppetOrchestratorRuntime>): Promise<void> {
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

  /** The view a puppet is assigned to, if any (absent = falls back to the default view). */
  public getAssignedView(id: PuppetKey): ViewKey | undefined {
    return this._runtime.assignments[id];
  }

  public async assignView(id: PuppetKey, viewKey: ViewKey): Promise<void> {
    await this.updateRuntime({ assignments: { ...this._runtime.assignments, [id]: viewKey } });
    // Kick off navigation but don't block the caller on the browser load (up to load_timeout).
    // Load success/failure reaches the UI via the state broadcast (puppet Online/Error).
    // TODO: Add feedback toast to ui? Or make it actually wait?
    void this._navigatePuppet(id).catch((e) => this._logger.error(`Navigation failed for puppet "${id}":`, e));
    this._logger.info(`Assigned puppet "${id}" to view "${viewKey}".`);
  }

  public async unassignView(id: PuppetKey): Promise<void> {
    const assignments = { ...this._runtime.assignments };
    delete assignments[id];
    await this.updateRuntime({ assignments });
    // Fire-and-forget the navigation (→ default view or about:blank); see assignView.
    // TODO: Add feedback toast to ui? Or make it actually wait?
    void this._navigatePuppet(id).catch((e) => this._logger.error(`Navigation failed for puppet "${id}":`, e));
    this._logger.info(`Unassigned puppet "${id}".`);
  }

  public getDefaultViewKey(): ViewKey | undefined {
    return this._runtime.default_view;
  }

  public async setDefaultView(viewKey: ViewKey | undefined): Promise<void> {
    await this.updateRuntime({ default_view: viewKey });
    // Unassigned puppets follow the default, so re-navigate them.
    for (const id of this._puppets.keys()) {
      if (this.getAssignedView(id) === undefined) await this._navigatePuppet(id);
    }
    this._logger.info(`Set default view to "${viewKey ?? "(none)"}".`);
  }

  /** The view a puppet currently resolves to: its assignment, else the default. */
  private _resolvedViewKey(id: PuppetKey): ViewKey | undefined {
    return this.getAssignedView(id) ?? this.getDefaultViewKey();
  }

  /** Re-navigate any puppets currently showing this view (assigned to it, or unassigned + it's the default). */
  public async onViewUpdated(key: ViewKey): Promise<void> {
    for (const id of this._puppets.keys()) {
      if (this._resolvedViewKey(id) === key) await this._navigatePuppet(id);
    }
  }

  /**
   * A view was deleted. Drop it from assignments and the default, then re-navigate any
   * puppet that was showing it (now falling back to the default view or about:blank).
   */
  public async onViewRemoved(key: ViewKey): Promise<void> {
    const affected = [...this._puppets.keys()].filter((id) => this._resolvedViewKey(id) === key);

    const assignments = { ...this._runtime.assignments };
    let changed = false;
    for (const [id, viewKey] of Object.entries(assignments)) {
      if (viewKey === key) {
        delete assignments[id];
        changed = true;
      }
    }
    const clearsDefault = this._runtime.default_view === key;
    if (changed || clearsDefault) {
      await this.updateRuntime({
        assignments,
        ...(clearsDefault ? { default_view: undefined } : {}),
      });
    }

    for (const id of affected) await this._navigatePuppet(id);
    this._logger.info(`Cleared references to removed view "${key}".`);
  }

  /** Resolve a puppet's assigned (or default) view into the runtime target it should load. */
  private _resolveTargetRuntime(id: PuppetKey): PuppetRuntime {
    const vm = this._viewManager;
    const viewKey = this._resolvedViewKey(id);
    const view = vm && viewKey !== undefined ? vm.getView(viewKey) : undefined;
    if (!vm || viewKey === undefined || !view) return BLANK_PUPPET_TARGET;
    return {
      target: `${this._serveBase}${vm.viewPath(viewKey)}`,
      load_timout: view.getConfig().loadTimeout ?? vm.getDefaultLoadTimeout(),
    };
  }

  private async _navigatePuppet(id: PuppetKey): Promise<void> {
    await this.updatePuppetRuntime(id, this._resolveTargetRuntime(id));
  }

  public async init(): Promise<void> {
    if (this._hasStarted)
      return this._logger.error("Attempted to initialised, but is already started!");

    this._store = new PuppetOrchestratorStore();
    const runtime = await this._store.loadRuntime(); // TODO: All fields have defaults. Will this ever be null, store uses the schema to parse.
    if (runtime) {
      this.updateRuntime(runtime);
    }
    else {
      this._logger.debug("No runtime found, using defaults.");
    }


    // Init each puppet, then navigate it to its assigned view (re-resolved from the
    // assignment, so the orchestrator, not the puppet's cached target, is authoritative).
    await Promise.all(
      [...this._puppets].map(async ([id, bundle]) => {
        await bundle.puppet.init();
        await this._navigatePuppet(id);
      }),
    );
  }

  public getHandlers(): PuppetWebhandlers {
    return {
      updateOrchestratorRuntime: (runtime: Partial<PuppetOrchestratorRuntime>) => this.updateRuntime(runtime),
      updateRuntime: (id: PuppetKey, runtime: Partial<PuppetRuntime>) => this.updatePuppetRuntime(id, runtime),
      assignView: (puppet: PuppetKey, view: ViewKey) => this.assignView(puppet, view),
      unassignView: (puppet: PuppetKey) => this.unassignView(puppet),
    }
  }
}
