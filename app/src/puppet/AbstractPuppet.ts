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
  private logger: Logger;

  private getLogLabels() {
    return ["PPT"];
  }

  private target: PuppetTarget = '';

  constructor() {
    super();
    this.logger = new Logger(this.getLogLabels());
    this.logger.info("Constructing...");
  }
}