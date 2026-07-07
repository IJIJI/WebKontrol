import EventEmitter from "node:events";
import * as path from "node:path";
import { Logger } from "../logging/Logger";
import { ConnectionState } from "../types/CommonTypes";
import type {
  PuppetInfo,
  PuppetInfoBundle,
  TargetInfo,
} from "./types/model";
import { PuppetStore } from "../storage/stores/PuppetStore";
import { BLANK_PUPPET_TARGET, PuppetRuntimeSchema, type BasePuppetConfig, type PuppetKey, type PuppetRuntime, type PuppetTarget } from "./types/schema";


export type PuppetEvents = {
  load_success: [info: TargetInfo];
  load_fail: [taret: PuppetTarget];
  info_update: [info: PuppetInfo];
  runtime_update: [info: PuppetRuntime];
};

export abstract class AbstractPuppet<
  TConfig extends BasePuppetConfig = BasePuppetConfig,
  TEvents extends PuppetEvents & Record<string, unknown[]> = PuppetEvents,
> extends EventEmitter<TEvents> {

  private readonly IMG_FOLDER: string;

  protected _logger!: Logger;
  protected _store!: PuppetStore;
  protected _isInit = false;

  protected _getLogLabels(): Array<string> {
    return ["PPT", ...this._getLogLabelExtensions(), this._config.id];
  }

  protected abstract _getLogLabelExtensions(): Array<string>;

  protected _config: TConfig;
  protected _runtime: PuppetRuntime = BLANK_PUPPET_TARGET;

  protected _info: PuppetInfo = {
    state: ConnectionState.OFFLINE,
  };

  constructor(config: TConfig) {
    super();
    this._config = config;

    this.IMG_FOLDER = path.join(
      process.cwd(),
      "db",
      "images",
      `${this._config.id}`,
    );
  }

  getConfig(): TConfig {
    return this._config;
  }

  getKey(): PuppetKey {
    return this._config.id;
  }

  protected abstract _doInit(): Promise<void>;

  protected abstract _doSetTarget(target: PuppetTarget): Promise<void>;

  protected abstract _getTargetInfo(): Promise<TargetInfo> | TargetInfo;

  // The following is disabled, as the screenshot function is to be implemented optionally in extending classes.
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  protected async _doScreenshot(path: string): Promise<void> {
    throw new Error("Screenshot not implemented for this puppet"); // TODO: Fail Silently or add another way to differentiate between fails and not implemented? Error type?
  }

  async init(): Promise<void> {
    try {
      if (this._isInit) {
        this._logger.warn("Attempted init, after it has already been done. Disregarding.");
        return;
      }
      this._logger = new Logger(this._getLogLabels());
      this._logger.info("Initializing...");

      this._store = new PuppetStore(this._config.id);

      const loaded = await this._store.loadRuntime();
      if (loaded)
        this._runtime = loaded;
      else
        this._logger.debug("No runtime found in store, showing a blank page until one is set.");

      await this._doInit();
      this._isInit = true;
      await this._updateInfo({ state: ConnectionState.ONLINE }); // TODO: Make sure this is kept up to date.

      this._logger.info("Initialized.");

      await this._setTarget(this._runtime.target);

      this._logger.info("Appied runtime.");
    } catch (error) {
      this._info.state = ConnectionState.FAILED;
      return this._logger.fatal("Failed to initialize", error);
    }
  }

  async clearRuntime(): Promise<void> {
    if (!this._isInit) throw new Error("Puppet not initialized");
    await this._store.clearRuntime();

    const old = this._runtime;
    this._runtime = BLANK_PUPPET_TARGET;

    if (old.target !== this._runtime.target)
      await this._setTarget(this._runtime.target);
  }

  // TODO: Add target info? -> Needs a caller for some implementations?
  // TODO: Load url from the puppet?
  async getInfo(): Promise<PuppetInfoBundle> {
    return {
      info: {
        ...this._info,
        target_info: await this._getTargetInfo(),
      },
      config: this._config,
      runtime: this._runtime,
    };
  }

  protected async _updateInfo(info?: Partial<PuppetInfo>): Promise<void> {
    this._info = { ...this._info, ...info };

    // TODO: Add async callback to allow for target_info loading?

    (this as EventEmitter<PuppetEvents>).emit("info_update", (await this.getInfo()).info);
  }

  async updateRuntime(runtime: Partial<PuppetRuntime>): Promise<void> {
    try { // TODO: Should this be in try catch?
      if (!this._isInit) throw new Error("Puppet not initialized");

      const old = this._runtime;
      this._runtime = { ...this._runtime, ...runtime };

      if (
        old.target !== this._runtime.target
      )
        await this._setTarget(this._runtime.target);

      await this._store.saveRuntime(this._runtime);
    } catch (error) {
      this._logger.error("Failed to update runtime", error);
      // TODO: Add some sort of feedback to caller.
    }
  }

  protected async _setTarget(target: PuppetTarget): Promise<void> {
    try {

      await this._doSetTarget(target);
      // this._updateInfo(result.info); //TODO instead of success and fail just a bundle with target info, puppet info and state?

      // The blank placeholder has no content to read, and evaluating against it races with
      // Chromium tearing down/recreating its execution context right after navigation resolves.
      const targetInfo = target === BLANK_PUPPET_TARGET.target ? {} : await this._getTargetInfo();

      (this as EventEmitter<PuppetEvents>).emit("load_success", targetInfo);
    } catch (error) {
      this._logger.error("Failed to set target", error);
      this._setFailedLoadingState();
      (this as EventEmitter<PuppetEvents>).emit("load_fail", target);
    }
  }

  protected _setFailedLoadingState(): void {
    this._info.state = ConnectionState.ERROR;
    // TODO: Try to go to error page.
    // TODO: Add a way to differentiate between a load fail and a library fail. -> Error types?
  }

  // TODO: Errors if the folder does not exist. Fix!
  // TODO: Should this have try and catch?
  // TODO: Use some sort of filename generator and store index in db
  // TODO: Use db entry as return type.
  async getScreenshot(): Promise<string> {
    if (!this._isInit) throw new Error("Puppet not initialized");

    const imgPath: string = path.join( // TODO: Make generate folders in a better way.
      this.IMG_FOLDER,
      `${new Date().toISOString()}.png`,
    );

    await this._doScreenshot(imgPath); // TODO: Multiple image history storage? In DB?

    return imgPath;
  }
}
