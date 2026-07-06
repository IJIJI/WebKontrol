import { Logger } from "../logging/Logger";
import type { UiManager } from "../ui/UiManager";
import type { WebServer } from "../webServer/WebServer";
import type { PuppetManager } from "./puppet/PuppetManager";

export interface OrchestratorConfig {
  puppetManager: PuppetManager;
  webServer: WebServer;
  uiManager: UiManager;
}

export class Orchestrator { // TODO: Move every non-puppet management from the appcore to this.
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _hasStarted: boolean = false;

  private _puppetManager: PuppetManager;

  private _webServer: WebServer;
  private _uiManager: UiManager;

  constructor(config: OrchestratorConfig) {
    this._puppetManager = config.puppetManager;
    this._webServer = config.webServer;
    this._uiManager = config.uiManager;
  }

  public getPuppetManager(): PuppetManager {
    return this._puppetManager;
  }

  public async init(): Promise<void> {
    //TODO: Wire WebServer, ...
    await this._puppetManager.init();
    await this._uiManager.init();
    await this._webServer.start(); // TODO rename to init? Or split?
  }
  


}
