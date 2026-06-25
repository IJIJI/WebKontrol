import { Logger } from "./logging/Logger";
import type { AbstractPuppet } from "./puppet/AbstractPuppet";
import type { Puppet } from "./puppet/PuppeteerPuppet";
import type { PuppetKey } from "./puppet/types";



export interface CoreInfo {
  startTime: number;
}

export class AppCore {
  private logger = new Logger(["CORE"]);

  private puppets: Map<PuppetKey, AbstractPuppet> = new Map();
  
  private info: CoreInfo = {
    startTime: Date.now()
  };
  
  constructor() {}
  
  public async start() {
    this.logger.info("Starting AppCore...");
  }
}