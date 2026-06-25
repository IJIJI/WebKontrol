import EventEmitter from "node:events";
import { Logger } from "../logging/Logger";
import type { PuppetInfo, PuppetTarget, SetTargetFail, SetTargetResult, SetTargetSuccess, TargetInfo } from "./types";

export type PuppetEvents = {
  load_success: [result: SetTargetSuccess];
  load_fail: [result: SetTargetFail];
  info_update: [info: unknown];
};


export abstract class AbstractPuppet<
  T extends PuppetEvents & Record<string, unknown[]> = PuppetEvents,
> extends EventEmitter<T> {
  
  private _logger!: Logger;

  protected _isInit = false;

  private _getLogLabels() {
    return ["PPT"];
  }

  protected _target_url: PuppetTarget = '';

  protected _info: Omit<PuppetInfo, 'target'> = {
    target: {
      url: '',
    },
  };

  constructor() {
    super();
  }

  async init(): Promise<void> {
    this._logger = new Logger(this._getLogLabels());
    this._logger.info("Initializing...");
    await this._doInit();
    this._logger.info("Initialized.");
  }

  protected abstract _doInit(): Promise<void>;
}