import { Logger } from "./logging/Logger";



export interface CoreInfo {
  startTime: number;
}

export class AppCore {
  private logger = new Logger(["CORE"]);
  
  private info: CoreInfo = {
    startTime: Date.now()
  };
  
  constructor() {}
  
  public async start() {
    this.logger.info("Starting AppCore...");
  }
}