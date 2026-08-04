import EventEmitter from "node:events";
import { Logger } from "../logging/Logger";
import { ConnectionState } from "../types/CommonTypes";
import type {
  PuppetInfo,
  TargetInfo,
} from "./types/model";
import { PuppetStore } from "../storage/stores/PuppetStore";
import { BLANK_PUPPET_TARGET, type BasePuppetConfig, type PuppetKey, type PuppetRuntime, type PuppetTarget } from "./types/schema";
import type { EntityAppearance } from "../common/entityAppearance/schema";


export type PuppetEvents<TConfig extends BasePuppetConfig> = {
  info_update: [info: PuppetInfo];
  runtime_update: [runtime: PuppetRuntime];
  config_update: [config: TConfig];
  appearance_update: [appearance: EntityAppearance];
};

export abstract class AbstractPuppet<
  TConfig extends BasePuppetConfig = BasePuppetConfig,
> extends EventEmitter<PuppetEvents<TConfig>> {

  protected _logger!: Logger;
  protected _store!: PuppetStore;
  protected _isInit = false;

  protected _getLogLabels(): Array<string> {
    return ["PPT", ...this._getLogLabelExtensions(), this._config.id];
  }

  protected abstract _getLogLabelExtensions(): Array<string>;

  protected _config: TConfig;
  protected _runtime: PuppetRuntime = BLANK_PUPPET_TARGET;
  protected _appearance: EntityAppearance = {};

  protected _info: PuppetInfo = {
    state: ConnectionState.OFFLINE,
  };

  private _isNavigating = false;
  private _lastTargetInfo: TargetInfo = {};

  constructor(config: TConfig) {
    super();
    this._config = config;

    this._logger = new Logger(this._getLogLabels());
  }

  protected abstract _doInit(): Promise<void>;

  protected abstract _doSetTarget(target: PuppetTarget): Promise<void>;

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

  async updateAppearance(appearance: EntityAppearance): Promise<void> {
    if (!this._isInit) throw new Error("Puppet not initialized");
    this._appearance = appearance;
    await this._store.saveAppearance(appearance);
    this.emit('appearance_update', this._appearance);
  }

  getLastInfo(): PuppetInfo {
    return {
      ...this._info,
      target_info: this._lastTargetInfo,
    };
  }

  async getInfo(): Promise<PuppetInfo> {
    // Evaluating against the page while it's navigating races the execution
    // context being torn down. _isNavigating avoids starting that work in the
    // common case, but a call already in flight when navigation starts can
    // still lose the race, so fall back to the last known info on failure too.
    if (!this._isNavigating) {
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
      if (loaded)
        this._runtime = loaded;
      else
        this._logger.debug("No runtime found in store, showing a blank page until one is set.");

      const loadedAppearance = await this._store.loadAppearance();
      if (loadedAppearance) this._appearance = loadedAppearance;

      this.emit('config_update', this._config);
      this.emit('runtime_update', this._runtime)
      this.emit('appearance_update', this._appearance);

      await this._doInit();
      this._isInit = true;

      await this._setTarget(this._runtime.target);
      await this._updateInfo({ state: ConnectionState.ONLINE });
      this._logger.info("Initialized.");

      this._logger.info("Appied runtime.");
    } catch (error) {
      await this._updateInfo({ state: ConnectionState.FAILED });
      this._logger.error("Failed to initialize", error);
    }
  }


  protected async _updateInfo(info?: Partial<PuppetInfo>): Promise<void> {
    this._info = { ...this._info, ...info };

    // TODO: Add async callback to allow for target_info loading?

    this.emit("info_update", await this.getInfo());
  }


  async updateRuntime(runtime: Partial<PuppetRuntime>): Promise<void> {
    try { // TODO: Should this be in try catch?
      if (!this._isInit) throw new Error("Puppet not initialized");

      this._runtime = { ...this._runtime, ...runtime };

      // if (
      //   old.target !== this._runtime.target // (`old` was the pre-spread this._runtime)
      // ) // TODO: Commented to allow renavigation for url websites, as they can change with buttons. BlockViews might reload because of this. Once puppets have their own endpoint, this wil probably be fixed.
      await this._setTarget(this._runtime.target);

      await this._store.saveRuntime(this._runtime);

    } catch (error) {
      this._logger.error("Failed to update runtime", error);
    } finally {
      this.emit('runtime_update', this._runtime);
    }
  }  
  
  async clearRuntime(): Promise<void> {
    if (!this._isInit) throw new Error("Puppet not initialized");

    await this.updateRuntime({ ...BLANK_PUPPET_TARGET });
  }

  protected async _setTarget(target: PuppetTarget): Promise<void> {
    this._isNavigating = true;
    try {

      await this._doSetTarget(target);
      // this._updateInfo(result.info); //TODO instead of success and fail just a bundle with target info, puppet info and state?

      // The blank placeholder has no content to read, and evaluating against it races with
      // Chromium tearing down/recreating its execution context right after navigation resolves.
      const targetInfo = target === BLANK_PUPPET_TARGET.target ? {} : await this._getTargetInfo();
      this._lastTargetInfo = targetInfo;

    } catch (error) {
      this._logger.error("Failed to set target", error);
      this._setFailedLoadingState();
    } finally {
      this._isNavigating = false;
      await this._updateInfo();
    }
  }

  protected _setFailedLoadingState(): void {
    this._info.state = ConnectionState.ERROR;
    // TODO: Try to go to error page.
    // TODO: Add a way to differentiate between a load fail and a library fail. -> Error types?
  }

}
