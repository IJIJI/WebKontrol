import { Logger } from "../logging/Logger";
import { UiManager } from "../ui/UiManager";
import { WebServer } from "../webServer/WebServer";
import { ConfigManager } from "./config/ConfigManager";
import type { AppConfig } from "./config/model";
import { AppCore, type AppCoreConfig } from "./AppCore";
import { PuppetFactory } from "./puppet/PuppetFactory";
import { PuppetOrchestrator } from "./puppet/PuppetOrchestrator";
import { SystemManager } from "../system/SystemManager";



export class LifeCycle {
  private _logger = new Logger(["LIFECYCLE"]);

  private _configManager: ConfigManager;

  constructor() { // TODO: All static?
    this._configManager = new ConfigManager();
  }

  public async construct(): Promise<AppCore> {
    this._logger.important("Initiating app from config...");

    await this._configManager.init();

    const appConfig: AppConfig = this._configManager.getConfig();

    const systemManager: SystemManager = new SystemManager();

    const puppetOrchestrator: PuppetOrchestrator = new PuppetOrchestrator();

    for (const pupConfig of appConfig.puppets.entries) {
      const puppet = PuppetFactory.createPuppet(pupConfig);
      puppetOrchestrator.addPuppet(puppet);
    }

    const webServer: WebServer = new WebServer(appConfig.web);
    const uiManager: UiManager = new UiManager();

    const orchestratorConf: AppCoreConfig = {
      puppetOrchestrator: puppetOrchestrator,
      webServer: webServer,
      uiManager: uiManager,
    }

    return new AppCore(orchestratorConf);    

  }
  
}