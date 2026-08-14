import EventEmitter from "node:events";
import { Logger } from "../logging/Logger";
import { ConnectionState } from "../types/CommonTypes";
import {
  KnownFailure,
  NavigationFailure,
  NavigationState,
  type PuppetInfo,
  type TargetInfo,
} from "./types/model";
import { PuppetStore } from "../storage/stores/PuppetStore";
import { BLANK_NAVIGATION_REQUEST, PuppetRuntimeSchema, type BasePuppetConfig, type NavigationRequest, type PuppetKey, type PuppetRuntime } from "./types/schema";
import type { EntityAppearance } from "../common/entityAppearance/schema";
import { errorMessage } from "../helpers/error";


/**
 * What a navigation transition may claim (Introduce Parameter Object: the validity of
 * the other fields depends on the state, which positional optionals cannot express).
 * No IDLE member: nothing transitions to IDLE, it is only ever the initial state.
 */
type NavigationInput =
  | { state: NavigationState.LOADING | NavigationState.LOADED; request: NavigationRequest }
  | { state: NavigationState.FAILED; request: NavigationRequest; error: unknown };

export type PuppetEvents = {
  info_update: [info: PuppetInfo];
  runtime_update: [runtime: PuppetRuntime];
  appearance_update: [appearance: EntityAppearance];
};

export abstract class AbstractPuppet<
  TConfig extends BasePuppetConfig = BasePuppetConfig,
> extends EventEmitter<PuppetEvents> {

  protected _logger!: Logger;
  protected _store!: PuppetStore;
  protected _isInit = false;

  // Set for the whole of close(), so crash handlers can tell a deliberate shutdown
  // from a browser that died on its own.
  protected _isClosing = false;

  protected _getLogLabels(): Array<string> {
    return ["PPT", ...this._getLogLabelExtensions(), this._config.id];
  }

  protected abstract _getLogLabelExtensions(): Array<string>;

  protected _config: TConfig;
  protected _runtime: PuppetRuntime = PuppetRuntimeSchema.parse({});
  protected _appearance: EntityAppearance = {};

  protected _info: PuppetInfo = {
    state: ConnectionState.OFFLINE,
    moment: Date.now(),
    navigation: {
      state: NavigationState.IDLE,
      moment: Date.now(),
    }
  };

  // Absent until a page has actually been read, so "nothing loaded" isn't reported
  // as a loaded page with no metadata.
  private _lastTargetInfo?: TargetInfo;

  constructor(config: TConfig) {
    super();
    this._config = config;

    this._logger = new Logger(this._getLogLabels());
  }

  protected abstract _doInit(): Promise<void>;

  protected abstract _doClose(): Promise<void>;

  protected abstract _doNavigate(request: NavigationRequest): Promise<void>;

  protected abstract _getTargetInfo(): Promise<TargetInfo> | TargetInfo;

  getConfig(): TConfig {
    return this._config;
  }

  getRuntime(): PuppetRuntime {
    return this._runtime;
  }

  getKey(): PuppetKey {
    return this._config.id;
  }

  getAppearance(): EntityAppearance {
    return this._appearance;
  }

  // TODO: Partial?
  async updateAppearance(appearance: EntityAppearance): Promise<void> {
    if (!this._isInit) throw new Error("Puppet not initialized");

    await this._store.saveAppearance(appearance);
    this._appearance = appearance;
    this.emit('appearance_update', this._appearance);
  }

  getLastInfo(): PuppetInfo {
    return {
      ...this._info,
      target_info: this._lastTargetInfo,
    };
  }

  protected get _isNavigating(): boolean {
    return this._info.navigation.state === NavigationState.LOADING;
  }

  async getInfo(): Promise<PuppetInfo> {
    // Only read the live page when there is one to read.
    if (this._info.state === ConnectionState.ONLINE && !this._isNavigating) {
      try {
        this._lastTargetInfo = await this._getTargetInfo();
      } catch (error) {
        this._logger.debug("Failed to read target info, likely due to a concurrent navigation. Using last known info.", error);
      }
    }
    return this.getLastInfo();
  }

  async init(): Promise<void> {
    try {
      if (this._isInit) {
        this._logger.warn("Attempted init, after it has already been done. Disregarding.");
        return;
      }
      this._logger.info("Initializing...");

      this._store = new PuppetStore(this._config.id);

      const loaded = await this._store.loadRuntime();
      if (loaded) {
        this._runtime = loaded;
        this._logger.debug("Loaded runtime.", loaded);
      }
      else {
        this._logger.debug("No runtime found in store, using defaults.");
      }

      const loadedAppearance = await this._store.loadAppearance();
      if (loadedAppearance) {
        this._appearance = loadedAppearance;
        this._logger.debug("Loaded appearance.", loaded);
      }

      this.emit('runtime_update', this._runtime)
      this.emit('appearance_update', this._appearance);

      await this._doInit();
      this._isInit = true;

      this._setConnection(ConnectionState.ONLINE);
      this._logger.info("Initialized.");

    } catch (error) {
      this._setConnection(ConnectionState.FAILED, error);
      this._logger.error("Failed to initialize", error);
    }
  }

  /**
   * Shut the puppet down. Idempotent, and swallows on purpose: a close that went badly
   * leaves the puppet just as unusable as one that went well, so there is nothing for a
   * caller to do about it beyond seeing the log.
   */
  async close(): Promise<void> {
    if (!this._isInit || this._isClosing) return;
    this._isClosing = true;

    this._logger.info("Closing...");
    try {
      await this._doClose();
    } catch (error) {
      this._logger.warn("Close did not complete cleanly.", error);
    } finally {
      // No error: this state was asked for, it is not a fault.
      this._setConnection(ConnectionState.OFFLINE);
      this._logger.info("Closed.");
    }
  }


  /**
   * Commit a state change and broadcast it. Deliberately synchronous and never touching
   * the live page: recording a state must not be blockable by the page that caused it,
   * or a wedged page could hang the recording of its own failure. Freshness of target
   * info is _refreshTargetInfo's job.
   */
  protected _updateInfo(info?: Partial<PuppetInfo>): void {
    this._info = { ...this._info, ...info };

    try {
      this.emit("info_update", this.getLastInfo());
    } catch (error) {
      // A listener's bug must not join the puppet's state machine, where it would be
      // misrecorded as this puppet failing. One line per emit, not per listener, so a
      // broken listener firing on every broadcast cannot flood the log.
      this._logger.error("An info_update listener threw.", error);
    }
  }

  /**
   * Read fresh target info from the live page into the cache and rebroadcast.
   * Fire and forget.
   */
  // ponytail: unguarded concurrent reads; an older read resolving late can briefly
  // leave stale title/description in the broadcast. Cosmetic, self-corrects on the
  // next navigation event. Add a read generation if it ever misleads anyone.
  protected async _refreshTargetInfo(): Promise<void> {
    if (this._info.state !== ConnectionState.ONLINE || this._isNavigating) return;

    try {
      this._lastTargetInfo = await this._getTargetInfo();
      this._updateInfo();
    } catch (error) {
      this._logger.debug("Failed to read target info, keeping the last known.", error);
    }
  }


  async updateRuntime(runtime: Partial<PuppetRuntime>): Promise<void> {
    if (!this._isInit) throw new Error("Puppet not initialized");

    // Persist before committing, so a failed write leaves memory and disk agreeing
    // and the caller can report the failure instead of silently diverging.
    const next = { ...this._runtime, ...runtime };
    await this._store.saveRuntime(next);

    this._runtime = next;
    this.emit('runtime_update', this._runtime);
  }


  /**
   * Record how the puppet's machinery is doing. Always pass `error` on the way into a
   * degraded state and omit it on the way back out: `_updateInfo` merges partials, so a
   * state set without it would keep reporting the previous failure's message.
   */
  protected _setConnection(state: ConnectionState, error?: unknown): void {
    this._updateInfo({
      state,
      error: error === undefined ? undefined : errorMessage(error),
      moment: Date.now(),
    });
  }

  /**
   * What kind of failure this was, in whatever terms the driver can tell. Non-abstract
   * and defaulting to UNKNOWN so a driver with nothing better to say is not forced to
   * pretend it knows.
   */
  protected _classifyFailure(_error: unknown): NavigationFailure {
    return NavigationFailure.UNKNOWN;
  }

  /** A thrower that already stated its kind outranks whatever the driver can guess. */
  private _deriveFailureKind(error: unknown): NavigationFailure {
    return error instanceof KnownFailure ? error.kind : this._classifyFailure(error);
  }

  /**
   * Record what the puppet was asked to show and how that went. Failure kind and HTTP
   * status are derived here rather than passed, so no call site can forget them.
   */
  protected _setNavigation(input: NavigationInput): void {
    this._updateInfo({
      navigation:
        input.state === NavigationState.FAILED
          ? {
              state: input.state,
              request: input.request,
              failure: this._deriveFailureKind(input.error),
              error: errorMessage(input.error),
              status: input.error instanceof KnownFailure ? input.error.status : undefined,
              moment: Date.now(),
            }
          : { state: input.state, request: input.request, moment: Date.now() },
    });
  }

  // Increments per navigate() call: the latest call owns the navigation record, and a
  // superseded call must write nothing. Not a queue on purpose: queueing would make a
  // superseded target burn its full load_timeout before the current one starts.
  private _navigationGeneration = 0;

  /**
   * Contract: throwing means the navigation failed. Returning means it either succeeded
   * or was superseded by a newer call, and in both cases the caller has nothing left to
   * do; the newer navigation owns the outcome.
   */
  async navigate(request: NavigationRequest): Promise<void> {
    if (!this._isInit) throw new Error("Puppet not initialized");
    if (this._isClosing) return;

    const generation = ++this._navigationGeneration;
    this._logger.info(`Navigation #${generation} to ${request.target} starting.`);
    this._setNavigation({ state: NavigationState.LOADING, request });

    try {
      await this._doNavigate(request);
    } catch (error) {
      // The loser of two concurrent navigations rejects ("Navigation interrupted by
      // another one") after the winner wrote LOADING; without this check that lands
      // as a spurious FAILED on top of the winner.
      if (this._isSuperseded(generation)) return;

      this._logger.error(`Navigation #${generation} failed (${this._deriveFailureKind(error)}).`, error);
      this._setNavigation({ state: NavigationState.FAILED, request, error });
      throw error;
    }

    if (this._isSuperseded(generation)) return;

    this._logger.info(`Navigation #${generation} loaded.`);
    this._setNavigation({ state: NavigationState.LOADED, request });
    void this._refreshTargetInfo();
  }

  private _isSuperseded(generation: number): boolean {
    if (generation === this._navigationGeneration && !this._isClosing) return false;
    this._logger.debug(`Navigation #${generation} superseded, discarding its result.`);
    return true;
  }

  async clearNavigation(): Promise<void> {
    await this.navigate({ ...BLANK_NAVIGATION_REQUEST });
  }
}
