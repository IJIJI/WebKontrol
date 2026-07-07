import { Logger } from "../logging/Logger";
import type { UiManager } from "../ui/UiManager";
import type { WebServer } from "../webServer/WebServer";
import type { PuppetOrchestrator } from "./puppet/PuppetOrchestrator";

export interface OrchestratorConfig {
  puppetOrchestrator: PuppetOrchestrator;
  webServer: WebServer;
  uiManager: UiManager;
}

export class Orchestrator { // TODO: Move every non-puppet management from the appcore to this.
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _hasStarted: boolean = false;

  private _puppetOrchestrator: PuppetOrchestrator;

  private _webServer: WebServer;
  private _uiManager: UiManager;

  constructor(config: OrchestratorConfig) {
    this._puppetOrchestrator = config.puppetOrchestrator;
    this._webServer = config.webServer;
    this._uiManager = config.uiManager;
  }

  public getPuppetManager(): PuppetOrchestrator {
    return this._puppetOrchestrator;
  }

  public async init(): Promise<void> {
    //TODO: Wire WebServer, ...
    await this._puppetOrchestrator.init();
    await this._uiManager.init();
    await this._webServer.start(); // TODO rename to init? Or split?
  }
  


}
