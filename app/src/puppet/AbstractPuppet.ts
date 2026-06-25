import EventEmitter from "node:events";
import { Logger } from "../logging/Logger";
import type {
  PuppetConfig,
  PuppetInfo,
  PuppetTarget,
  SetTargetFail,
  SetTargetResult,
  SetTargetSuccess,
  TargetInfo,
} from "./types";
import { ConnectionState } from "../types/CommonTypes";

export type PuppetEvents = {
  load_success: [result: SetTargetSuccess];
  load_fail: [result: SetTargetFail];
  info_update: [info: PuppetInfo];
};

export abstract class AbstractPuppet<
  T extends PuppetEvents & Record<string, unknown[]> = PuppetEvents,
> extends EventEmitter<T> {
  private _logger!: Logger;

  protected _isInit = false;

  private _getLogLabels() {
    return ["PPT"];
  }

  protected _target_url: PuppetTarget = "";

  protected _info: Omit<PuppetInfo, "target"> & Partial<PuppetInfo> = {
    state: ConnectionState.OFFLINE,
  };

  protected _config: PuppetConfig;

  protected _is_initialized = false;

  constructor(config: PuppetConfig) {
    super();
    this._config = config; // TODO: Add Default Config?
    this._checkConfig(this._config);
  }

  protected _checkConfig(config: PuppetConfig) {
    if (!config.id)
      this._logger.fatal(`Invalid ID provided. Submitted config:`, config);
    if (config.display == null || config.display < 0 || config.display > 20)
      this._logger.fatal(`Valid Display is required. Submitted config:`, config);
  }

  protected abstract _doInit(): Promise<void>;

  protected abstract _doSetTarget(target: PuppetTarget): Promise<boolean>;

  protected abstract _getTargetInfo(): Promise<TargetInfo> | TargetInfo;

  async init(): Promise<void> {
    this._logger = new Logger(this._getLogLabels());
    this._logger.info("Initializing...");
    try {
      await this._doInit();
      this._is_initialized = true;
      this._logger.info("Initialized.");
    } catch (error) {
      this._info.state = ConnectionState.FAILED;
      return this._logger.fatal("Failed to initialize", error);
    }
  }

  protected _updateInfo(info?: Partial<PuppetInfo>) {

    const newInfo = { ...this._info, ...info };
    this._info = newInfo;

    (this as EventEmitter<PuppetEvents>).emit("info_update", newInfo);
  }

  async setTarget(target: PuppetTarget): Promise<SetTargetResult> {
    this._target_url = target;
    try {
      const success = await this._doSetTarget(target);
      if (success) {
        const result: SetTargetSuccess = {
          success: true,
          info: {
            url: this._target_url,

            // title: this._info.title, // TODO, also description and og
          },
        };
        // this._emitInfoUpdate(result.info); //TODO
        (this as EventEmitter<PuppetEvents>).emit("load_success", result);
        return result;
      } else {
        throw new Error("Failed to set target with unknown error!");
      }
    } catch (error) {
      this._logger.error("Failed to set target", error);
      const result: SetTargetFail = {
        success: false,
        info: {
          url: this._target_url,

          // title: this._info.title, // TODO, also description and og
        },
      };
      if (error instanceof Error) {
        result.error = error;
      }
      // this._emitInfoUpdate(result.info); //TODO
      (this as EventEmitter<PuppetEvents>).emit("load_fail", result);
      return result;
    }
  }

  async getInfo(): Promise<PuppetInfo> {
    return { ...this._info, target: await this._getTargetInfo() };
  }
}
