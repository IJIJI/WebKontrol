import EventEmitter from "node:events";
import * as path from "node:path";
import { Logger } from "../logging/Logger";
import { ConnectionState } from "../types/CommonTypes";
import type {
  PuppetInfo,
  PuppetInfoBundle,
  PuppetScreenshotFail,
  PuppetScreenshotResult,
  SetTargetFail,
  SetTargetResult,
  SetTargetSuccess,
  TargetInfo,
} from "./model";
import {
  PuppetRuntimeConfigSchema,
  type PuppetConfig,
  type PuppetKey,
  type PuppetRuntimeConfig,
  type PuppetTarget,
} from "./schema";
import { PuppetStore } from "../storage/PuppetStore";

export type PuppetEvents = {
  load_success: [result: SetTargetSuccess];
  load_fail: [result: SetTargetFail];
  info_update: [info: PuppetInfoBundle];
};

export abstract class AbstractPuppet<
  TConfig extends PuppetConfig = PuppetConfig,
  TEvents extends PuppetEvents & Record<string, unknown[]> = PuppetEvents,
> extends EventEmitter<TEvents> {
  protected _logger!: Logger;
  protected _store!: PuppetStore;
  protected _isInit = false;

  protected _getLogLabels(): Array<string> {
    return ["PPT", ...this._getLogLabelExtensions(), this._config.specific.id];
  }

  protected abstract _getLogLabelExtensions(): Array<string>;

  protected _config: TConfig;

  protected _info: PuppetInfo = {
    state: ConnectionState.OFFLINE,
  };

  constructor(config: TConfig) {
    super();
    this._config = config;
  }

  getConfig(): PuppetConfig {
    return this._config;
  }

  getKey(): PuppetKey {
    return this._config.specific.id;
  }

  protected abstract _doInit(): Promise<void>;

  protected abstract _doSetTarget(target: PuppetTarget): Promise<void>;

  protected abstract _getTargetInfo(): Promise<TargetInfo> | TargetInfo;

  // The following is disabled, as the screenshot function is to be implemented optionally in extending classes.
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  protected async _doScreenshot(path: string): Promise<void> {
    throw new Error("Screenshot not implemented for this puppet"); // TODO: Fail Silently or add another way to differentiate between fails and not implemented? Error type?
  }

  async init(clear_runtime: boolean = false): Promise<void> {
    try {
      this._logger = new Logger(this._getLogLabels());
      this._logger.info("Initializing...");

      this._store = new PuppetStore(this._config.specific.id);

      if (clear_runtime) {
        await this._store.saveRuntime(this._config.runtime);
      } else {
        this._config.runtime =
          (await this._store.loadRuntime()) ?? this._config.runtime;
      }

      await this._doInit();
      this._isInit = true;

      this._logger.info("Initialized.");

      await this._doSetTarget(this._config.runtime.target_url);
      this._logger.info("Target from config set.");
    } catch (error) {
      this._info.state = ConnectionState.FAILED;
      return this._logger.fatal("Failed to initialize", error);
    }
  }

  // TODO: Add target info? -> Needs a caller for some implementations?
  // TODO: Load url from the puppet?
  getInfo(): PuppetInfoBundle {
    return {
      ...this._info,
      config: {
        runtime: this._config.runtime,
        specific: this._config.specific,
      },
    };
  }

  protected _updateInfo(info?: Partial<PuppetInfo>): void {
    this._info = { ...this._info, ...info };

    // TODO: Add async callback to allow for target_info loading?

    (this as EventEmitter<PuppetEvents>).emit("info_update", this.getInfo());
  }

  async updateRuntime(config: Partial<PuppetRuntimeConfig>): Promise<void> {
    try {
      if (!this._isInit) throw new Error("Puppet not initialized");

      let targetChange: boolean = false;

      if (
        config.target_url &&
        config.target_url !== this._config.runtime.target_url
      )
        targetChange = true;

      this._config.runtime = PuppetRuntimeConfigSchema.parse({
        ...this._config.runtime,
        ...config,
      });

      if (targetChange) await this._setTarget(this._config.runtime.target_url);

      await this._store.saveRuntime(this._config.runtime);
    } catch (error) {
      this._logger.error("Failed to update runtime", error);
      // TODO: Add some sort of feedback to caller.
    }
  }

  protected async _setTarget(target: PuppetTarget): Promise<SetTargetResult> {
    // TODO: Remove try catch?
    try {
      // TODO: Consolidate return types. SetTargetResult -> UpdateRuntimeResult.

      this._config.runtime.target_url = target;

      await this._doSetTarget(target);
      const result: SetTargetSuccess = {
        success: true,
      };
      // this._updateInfo(result.info); //TODO
      (this as EventEmitter<PuppetEvents>).emit("load_success", result);
      return result;
    } catch (error) {
      this._logger.error("Failed to set target", error);
      const result: SetTargetFail = {
        success: false,
      };
      if (error instanceof Error) {
        result.error = error;
      }
      // this._updateInfo(result.info); //TODO
      this._setFailedLoadingState();
      (this as EventEmitter<PuppetEvents>).emit("load_fail", result);
      return result;
    }
  }

  protected _setFailedLoadingState(): void {
    this._info.state = ConnectionState.ERROR;
    // TODO: Try to go to error page.
    // TODO: Add a way to differentiate between a load fail and a library fail. -> Error types?
  }

  // TODO: Errors if the folder does not exist. Fix!
  // TODO: Store in db?
  async getScreenshot(): Promise<PuppetScreenshotResult> {
    try {
      if (!this._isInit) throw new Error("Puppet not initialized");

      const imgPath: string = path.join(
        process.cwd(),
        "db",
        "images",
        `${this._config.specific.id}.png`,
      );

      await this._doScreenshot(imgPath); // TODO: Multiple image history storage? In DB?

      return { success: true, path: imgPath };
    } catch (error) {
      const result: PuppetScreenshotFail = { success: false };
      if (error instanceof Error) {
        result.error = error;
      }
      return result;
    }
  }
}
