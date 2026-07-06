import { Logger } from "../logging/Logger";
import { UiManager } from "../ui/UiManager";
import { WebServer } from "../webServer/WebServer";
import { ConfigManager } from "./config/ConfigManager";
import type { AppConfig } from "./config/model";
import { Orchestrator, type OrchestratorConfig } from "./Orchestrator";
import { PuppetFactory } from "./puppet/PuppetFactory";
import { PuppetManager } from "./puppet/PuppetManager";



export class LifeCycle {
  private _logger = new Logger(["LIFECYCLE"]);

  private _configManager: ConfigManager;

  constructor() {
    this._configManager = new ConfigManager();
  }

  public async construct(): Promise<Orchestrator> {
    this._logger.important("Initiating app from config...");

    await this._configManager.init();

    const appConfig: AppConfig = this._configManager.getConfig();

    const puppetFactory = new PuppetFactory(appConfig.puppets.global);

    const puppetManager: PuppetManager = new PuppetManager();

    for (const pupConfig of appConfig.puppets.entries) {
      const puppet = puppetFactory.createPuppet(pupConfig);
      puppetManager.addPuppet(puppet);
    }

    const webServer: WebServer = new WebServer(appConfig.web);
    const uiManager: UiManager = new UiManager();

    const orchestratorConf: OrchestratorConfig = {
      puppetManager: puppetManager,
      webServer: webServer,
      uiManager: uiManager,
    }

    return new Orchestrator(orchestratorConf);    

  }
  
}