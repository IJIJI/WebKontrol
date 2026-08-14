import EventEmitter from "node:events";
import { Logger } from "../../logging/Logger";
import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import { BLANK_NAVIGATION_REQUEST, type NavigationRequest, type PuppetKey, type PuppetRuntime } from "../../puppet/types/schema";
import type { EntityAppearance } from "../../common/entityAppearance/schema";
import type { ViewKey } from "../../views/types/schema";
import type { ViewManager } from "../../views/ViewManager";
import type { PuppetWebhandlers } from "../../webServer/model";
import type { PuppetDataBundle } from "../../puppet/types/model";
import { PuppetOrchestratorStore } from "../../storage/stores/PuppetOrchestratorStore";
import { PuppetOrchestratorRuntimeSchema, type PuppetOrchestratorRuntime } from "./schema";
import { NavigationFailure, NavigationState } from "../../puppet/types/model";
import { RetryHandler, type BackoffPacing } from "../../puppet/pacing";
import { ConnectionState } from "../../types/CommonTypes";


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
        appearance: bundle.appearance,
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
    // All reaction to puppet trouble hangs off the broadcast, edge-triggered: it covers
    // every source of a state change (orchestrator navigations, repair replays, future
    // reload timers) with one pattern, instead of each initiator handling its own.
    puppet.on('info_update', (info) => {
      const previous = this._puppets.get(id)?.info;
      this._updatePuppetData(id, {info});
      if (!previous) return;
      if (previous.state !== info.state)
        this._onConnectionChange(id, previous.state, info.state);
      if (previous.navigation.state !== info.navigation.state && info.navigation.state === NavigationState.FAILED)
        this._onNavigationFailed(id);
    });
    puppet.on('appearance_update', (appearance) => this._updatePuppetData(id, {appearance}));

    const pupBundle: PuppetFullBundle = {
      puppet: puppet,
      runtime: puppet.getRuntime(),
      info: puppet.getLastInfo(),
      config: config,
      appearance: puppet.getAppearance(),
    }

    this._puppets.set(puppet.getKey(), pupBundle);
  }

  public async updatePuppetRuntime(id: PuppetKey, runtime: Partial<PuppetRuntime>): Promise<void> {
    if (!this._puppets.has(id))
      return this._logger.error(`Attempted to update runtime for puppet ${id}. It does not exist. Provided runtime:`, runtime);

    await this._puppets.get(id)?.puppet.updateRuntime(runtime);
  }

  public async updatePuppetAppearance(id: PuppetKey, appearance: EntityAppearance): Promise<void> {
    if (!this._puppets.has(id))
      return this._logger.error(`Attempted to update appearance for puppet ${id}. It does not exist.`);

    await this._puppets.get(id)?.puppet.updateAppearance(appearance);
  }

  /** The view a puppet is assigned to, if any (absent = falls back to the default view). */
  public getAssignedView(id: PuppetKey): ViewKey | undefined {
    return this._runtime.assignments[id];
  }

  public async assignView(id: PuppetKey, viewKey: ViewKey): Promise<void> {
    await this.updateRuntime({ assignments: { ...this._runtime.assignments, [id]: viewKey } });
    // Kick off navigation but don't block the caller on the browser load (up to load_timeout).
    // Load success/failure reaches the UI via the puppet's broadcast navigation state.
    void this._navigatePuppet(id);
    this._logger.info(`Assigned puppet "${id}" to view "${viewKey}".`);
  }

  public async unassignView(id: PuppetKey): Promise<void> {
    const assignments = { ...this._runtime.assignments };
    delete assignments[id];
    await this.updateRuntime({ assignments });
    // Fire-and-forget the navigation (→ default view or about:blank); see assignView.
    void this._navigatePuppet(id);
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

  /** Resolve a puppet's assigned (or default) view into the navigation it should perform. */
  private _resolveNavigation(id: PuppetKey): NavigationRequest {
    const vm = this._viewManager;
    const viewKey = this._resolvedViewKey(id);
    const view = vm && viewKey !== undefined ? vm.getView(viewKey) : undefined;
    if (!vm || viewKey === undefined || !view) return { ...BLANK_NAVIGATION_REQUEST };
    return {
      target: `${this._serveBase}${vm.viewPath(viewKey)}`,
      load_timeout: view.getConfig().loadTimeout ?? vm.getDefaultLoadTimeout(),
    };
  }

  // Navigation retries are cheap (a page load), so their cap is low: a display should
  // never show wrong content for minutes because of a network blip. Relaunches start a
  // whole Chromium, so they escalate to the default five minute cap.
  private _navRetries: Map<PuppetKey, RetryHandler> = new Map();
  private _relaunches: Map<PuppetKey, RetryHandler> = new Map();

  private _handlerFor(map: Map<PuppetKey, RetryHandler>, id: PuppetKey, pacing?: BackoffPacing): RetryHandler {
    let handler = map.get(id);
    if (!handler) {
      handler = new RetryHandler(pacing);
      map.set(id, handler);
    }
    return handler;
  }

  private _navRetryFor(id: PuppetKey): RetryHandler {
    return this._handlerFor(this._navRetries, id, { baseMs: 2_000, capMs: 60_000 });
  }

  private _relaunchFor(id: PuppetKey): RetryHandler {
    return this._handlerFor(this._relaunches, id);
  }

  /**
   * Navigate a puppet to whatever its assignment currently resolves to. Never rejects:
   * a load failure is an ongoing condition carried by the puppet's broadcast state, not
   * an error of whichever call happened to trigger the navigation, and the loops that
   * navigate many puppets must not stop at the first broken one.
   *
   * Failures retry forever on a backoff, always re-resolving (an assignment edited
   * between failure and retry navigates to the current target, never a replay). Any
   * fresh navigation supersedes a pending retry and resets the backoff: a config change
   * is new information, and nobody should wait out the delay to see their fix.
   */
  private async _navigatePuppet(id: PuppetKey, isRetry = false): Promise<void> {
    const puppet = this._puppets.get(id)?.puppet;
    if (!puppet)
      return this._logger.error(`Attempted to navigate puppet ${id}. It does not exist.`);

    const retry = this._navRetryFor(id);
    if (isRetry) retry.cancel();
    else retry.reset();

    try {
      await puppet.navigate(this._resolveNavigation(id));
      retry.reset();
    } catch (error) {
      // Recorded failures reach _onNavigationFailed via the broadcast edge; a throw
      // without a record (puppet not initialized, closing) is relaunch territory.
      this._logger.error(`Navigation failed for puppet "${id}".`, error);
    }
  }

  /**
   * A navigation was recorded FAILED, whoever initiated it: schedule the retry and put
   * the fallback page (clock + failure + countdown) on the display.
   */
  private _onNavigationFailed(id: PuppetKey): void {
    if (this._isClosing) return;

    const bundle = this._puppets.get(id);
    const navigation = bundle?.info.navigation;
    if (!bundle || navigation?.state !== NavigationState.FAILED) return;

    // A puppet whose machinery is down is relaunch territory; navigation retries
    // against a dead browser only churn, and the relaunch ends in a fresh navigation.
    if (bundle.info.state !== ConnectionState.ONLINE) return;

    // STATUS enters at the cap: the target answered and said no, so retrying changes
    // nothing until the target or the config does. Everything else starts at the
    // bottom, where a wrong guess costs a few cheap retries that escalate on their own.
    const delay = this._navRetryFor(id).schedule(
      () => void this._navigatePuppet(id, true),
      { atCap: navigation.failure === NavigationFailure.STATUS },
    );
    if (delay === undefined) return; // one already pending, and its countdown is already on screen

    this._logger.warn(`Retrying navigation for puppet "${id}" in ${delay}ms (${navigation.failure}).`);
    void bundle.puppet.showFallback({
      label: this._resolveLabel(id, navigation.request.target),
      failure: navigation.failure,
      error: navigation.error,
      retryInMs: delay,
    });
  }

  /** What the display was supposed to show, in operator terms: the view's name, or a short URL when no view resolves. */
  private _resolveLabel(id: PuppetKey, target: string): string {
    const viewKey = this._resolvedViewKey(id);
    const view = viewKey !== undefined ? this._viewManager?.getView(viewKey) : undefined;
    if (view) return view.getConfig().name.long;
    try {
      const url = new URL(target);
      return url.host + (url.pathname === "/" ? "" : url.pathname);
    } catch {
      return target;
    }
  }

  /**
   * Process-level recovery: a puppet that went OFFLINE (browser died) or FAILED (never
   * came up) gets restarted on the backoff, forever. Edge-triggered off the broadcast
   * state, so a boot-order failure heals within the first escalating minute and a
   * genuinely broken config settles into an occasional relaunch attempt.
   */
  private _onConnectionChange(id: PuppetKey, previous: ConnectionState, next: ConnectionState): void {
    if (this._isClosing) return;

    if (next === ConnectionState.ONLINE) {
      this._relaunchFor(id).reset();
      return;
    }

    if (next !== ConnectionState.OFFLINE && next !== ConnectionState.FAILED) return;
    // CLOSING → OFFLINE is a teardown we asked for: app shutdown (guarded above too)
    // or a restart's own close, which concludes with ONLINE or FAILED on its own.
    if (previous === ConnectionState.CLOSING) return;

    // A dead puppet's navigation retries only churn; the relaunch ends in a fresh
    // navigation anyway.
    this._navRetryFor(id).cancel();

    const delay = this._relaunchFor(id).schedule(() => void this._relaunchPuppet(id));
    if (delay !== undefined)
      this._logger.warn(`Relaunching puppet "${id}" in ${delay}ms (went ${next}).`);
  }

  private async _relaunchPuppet(id: PuppetKey): Promise<void> {
    const puppet = this._puppets.get(id)?.puppet;
    if (!puppet || this._isClosing) return;

    await puppet.restart(); // never rejects; the outcome is the resulting state
    // Landing FAILED re-enters _onConnectionChange, which schedules the next attempt.
    if (this._puppets.get(id)?.info.state === ConnectionState.ONLINE)
      await this._navigatePuppet(id);
  }

  public async init(): Promise<void> {
    if (this._hasStarted)
      return this._logger.error("Attempted to initialised, but is already started!");
    this._hasStarted = true;

    this._store = new PuppetOrchestratorStore();
    const runtime = await this._store.loadRuntime(); // TODO: All fields have defaults. Will this ever be null, store uses the schema to parse.
    if (runtime) {
      // Adopt and announce the loaded runtime directly; updateRuntime would re-save
      // to the store what was just loaded from it.
      this._runtime = runtime;
      this.emit('runtime_update', this.getRuntime());
    }
    else {
      this._logger.debug("No runtime found, using defaults.");
    }

    // Drop assignments for puppets no longer in the config, so removed puppets don't
    // leave ghost entries behind (the view-side mirror of this is onViewRemoved).
    const assignments = { ...this._runtime.assignments };
    let pruned = false;
    for (const id of Object.keys(assignments)) {
      if (!this._puppets.has(id)) {
        delete assignments[id];
        pruned = true;
      }
    }
    if (pruned) {
      await this.updateRuntime({ assignments });
      this._logger.info("Pruned assignments of puppets not in the config.");
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

  private _isClosing = false;

  /** Close every puppet, in parallel. Puppet close() never rejects, so neither does this. */
  public async close(): Promise<void> {
    this._isClosing = true;
    for (const handler of this._navRetries.values()) handler.cancel();
    for (const handler of this._relaunches.values()) handler.cancel();
    await Promise.all([...this._puppets.values()].map((bundle) => bundle.puppet.close()));
    this._logger.info("Closed all puppets.");
  }

  public getHandlers(): PuppetWebhandlers {
    return {
      updateOrchestratorRuntime: (runtime: Partial<PuppetOrchestratorRuntime>) => this.updateRuntime(runtime),
      updateRuntime: (id: PuppetKey, runtime: Partial<PuppetRuntime>) => this.updatePuppetRuntime(id, runtime),
      updateAppearance: (id: PuppetKey, appearance: EntityAppearance) => this.updatePuppetAppearance(id, appearance),
      assignView: (puppet: PuppetKey, view: ViewKey) => this.assignView(puppet, view),
      unassignView: (puppet: PuppetKey) => this.unassignView(puppet),
    }
  }
}
