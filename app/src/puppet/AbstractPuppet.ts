import EventEmitter from "node:events";
import { Logger } from "../logging/Logger";
import type { PuppetTarget } from "./types";

export type PuppetEvents = {
  failed_load: [error: Error];
  successful_load: []; // TODO: Return data? Screenshot?
};


export abstract class AbstractPuppet<
  T extends PuppetEvents & Record<string, unknown[]> = PuppetEvents,
> extends EventEmitter<T> {
  
  private _logger!: Logger;

  protected _isInit = false;

  private _getLogLabels() {
    return ["PPT"];
  }

  protected _target: PuppetTarget = '';

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