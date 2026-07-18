import { Logger } from "../logging/Logger";
import { UiManager } from "../ui/UiManager";
import { WebServer } from "../webServer/WebServer";
import { ConfigManager } from "./config/ConfigManager";
import type { AppConfig } from "./config/schema";
import { AppCore, type AppCoreConfig } from "./AppCore";
import { PuppetFactory } from "./puppet/PuppetFactory";
import { PuppetOrchestrator } from "./puppet/PuppetOrchestrator";
import { SystemManager } from "../system/SystemManager";
import { ViewManager } from "../views/ViewManager";
import { ViewServer } from "../views/ViewServer";



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


    const puppetOrchestrator: PuppetOrchestrator = new PuppetOrchestrator();

    for (const pupConfig of appConfig.puppets) {
      const puppet = PuppetFactory.createPuppet(pupConfig);
      puppetOrchestrator.addPuppet(puppet);
    }

    const viewManager = new ViewManager(appConfig.views);

    const orchestratorConf: AppCoreConfig = {
      puppetOrchestrator: puppetOrchestrator,
      webServer: new WebServer(appConfig.web),
      uiManager: new UiManager(),
      systemManager: new SystemManager(),
      viewManager: viewManager,
      viewServer: new ViewServer(viewManager), // transport for the views; reacts to the manager's events
    }

    return new AppCore(orchestratorConf);

  }
  
}