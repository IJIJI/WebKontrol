import EventEmitter from "node:events";
import * as path from "node:path";
import { Logger } from "../logging/Logger";
import type {
  PuppetConfig,
  PuppetInfo,
  PuppetInfoBundle,
  PuppetScreenshotFail,
  PuppetScreenshotResult,
  PuppetTarget,
  SetTargetFail,
  SetTargetResult,
  SetTargetSuccess,
  TargetInfo,
} from "./types";
import { ConnectionState, type WithRequired } from "../types/CommonTypes";

export type PuppetEvents = {
  load_success: [result: SetTargetSuccess];
  load_fail: [result: SetTargetFail];
  info_update: [info: PuppetInfoBundle];
};

export abstract class AbstractPuppet<
  T extends PuppetEvents & Record<string, unknown[]> = PuppetEvents,
> extends EventEmitter<T> {
  protected _logger!: Logger;

  protected _isInit = false;

  protected _getLogLabels(): Array<string> {
    return ["PPT"];
  }

  protected _info: PuppetInfo = {
    state: ConnectionState.OFFLINE,
  };

  protected _config: PuppetConfig;

  protected _is_initialized = false;

  public static readonly DefaultConfig: WithRequired<PuppetConfig, "target_url" | "load_wait"> = {
    // TODO: Different default? Internal virtual hosts?
    target_url: "http://127.0.0.1/splash/simple",
    load_wait: 2000,
  };


  constructor(config: PuppetConfig) {
    super();
    this._config = config;
    this._checkConfig(this._config);
  }

  protected _checkConfig(config: PuppetConfig): void {
    if (!config.id)
      this._logger.fatal(`Invalid ID provided. Submitted config:`, config);
    // TODO: Url check
  }

  protected abstract _doInit(): Promise<void>;

  protected abstract _doSetTarget(target: PuppetTarget): Promise<void>;

  protected abstract _getTargetInfo(): Promise<TargetInfo> | TargetInfo;

  async init(): Promise<void> {
    this._logger = new Logger(this._getLogLabels());
    this._logger.info("Initializing...");
    try {
      await this._doInit();

      this._is_initialized = true;
      this._logger.info("Initialized.");

      await this._doSetTarget(this._config.target_url);
      this._logger.info("Target from config set.");
    } catch (error) {
      this._info.state = ConnectionState.FAILED;
      return this._logger.fatal("Failed to initialize", error);
    }
  }

  
  getInfo(): PuppetInfoBundle {
    return { ...this._info, target_url: this._config.target_url };
  }

  getConfig(): PuppetConfig {
    return this._config;
  }

  protected _updateInfo(info?: Partial<PuppetInfo>): void {

    this._info = { ...this._info, ...info };

    // TODO: Add async callback to allow for target_info loading?

    (this as EventEmitter<PuppetEvents>).emit("info_update", this.getInfo());
  }

  async setTarget(target: PuppetTarget): Promise<SetTargetResult> {

    try {
      if (!this._is_initialized) throw new Error("Puppet not initialized");

      // TODO: Url Validation
      this._config.target_url = target;

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

      const imgPath: string = path.join(process.cwd(), "db", "images", `${this._config.id}.png`);

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

  // The following is disabled, as the screenshot function is to be implemented optionally in extending classes.
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  protected async _doScreenshot(path: string): Promise<void> {
    throw new Error("Screenshot not implemented for this puppet"); // TODO: Fail Silently or add another way to differentiate between fails and not implemented? Error type?
  };

}
