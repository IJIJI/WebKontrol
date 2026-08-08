import EventEmitter from "node:events";
import { Logger } from "../logging/Logger";
import { ConnectionState } from "../types/CommonTypes";
import {
  NavigationState,
  type PuppetInfo,
  type TargetInfo,
} from "./types/model";
import { PuppetStore } from "../storage/stores/PuppetStore";
import { BLANK_NAVIGATION_REQUEST, PuppetRuntimeSchema, type BasePuppetConfig, type NavigationRequest, type PuppetKey, type PuppetRuntime } from "./types/schema";
import type { EntityAppearance } from "../common/entityAppearance/schema";
import { errorMessage } from "../helpers/error";


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

      await this._setConnection(ConnectionState.ONLINE);
      this._logger.info("Initialized.");

    } catch (error) {
      await this._setConnection(ConnectionState.FAILED, error);
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
      await this._setConnection(ConnectionState.OFFLINE);
      this._logger.info("Closed.");
    }
  }


  protected async _updateInfo(info?: Partial<PuppetInfo>): Promise<void> {
    this._info = { ...this._info, ...info };

    this.emit("info_update", await this.getInfo());
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
  protected async _setConnection(state: ConnectionState, error?: unknown): Promise<void> {
    await this._updateInfo({
      state,
      error: error === undefined ? undefined : errorMessage(error),
      moment: Date.now(),
    });
  }

  /** Record what the puppet was asked to show and how that went. */
  protected async _setNavigation(state: NavigationState, request?: NavigationRequest, error?: unknown): Promise<void> {
    await this._updateInfo({
      navigation: {
        state,
        request,
        error: error === undefined ? undefined : errorMessage(error),
        moment: Date.now(),
      },
    });
  }
  
  async navigate(request: NavigationRequest): Promise<void> {
    if (!this._isInit) throw new Error("Puppet not initialized");
    
    try {  
      await this._setNavigation(NavigationState.LOADING, request);
      await this._doNavigate(request);
      await this._setNavigation(NavigationState.LOADED, request);
    } catch (error) {
      this._logger.error("Failed to navigate puppet", error);
      await this._setNavigation(NavigationState.FAILED, request, error);
      throw error;
      // TODO: Implement failed loading handeling -> Better differentiate on errors to decide if it is a webpage error or a puppeteer error.
    }
  }

  async clearNavigation(): Promise<void> {
    await this.navigate({ ...BLANK_NAVIGATION_REQUEST });
  }
}
