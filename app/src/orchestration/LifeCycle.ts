import { Logger } from "../logging/Logger";
import { UiManager } from "../ui/UiManager";
import { WebServer } from "../webServer/WebServer";
import { ConfigManager } from "./config/ConfigManager";
import type { AppConfig } from "./config/schema";
import { AppCore, type AppCoreConfig } from "./AppCore";
import { PuppetFactory } from "./puppet/PuppetFactory";
import { PuppetOrchestrator } from "./puppet/PuppetOrchestrator";
import { SystemManager } from "../system/SystemManager";
import { CoreDatabase } from "../storage/CoreDatabase";
import { GitHubReleases } from "../system/update/GitHubReleases";
import { UpdateManager } from "../system/update/UpdateManager";
import { UpdateRunner } from "../system/update/UpdateRunner";
import { ViewManager } from "../views/ViewManager";
import { ViewServer } from "../views/ViewServer";



export class LifeCycle {
  private _logger = new Logger(["LIFECYCLE"]);

  private _configManager: ConfigManager;

  constructor() { // TODO: All static?
    this._configManager = new ConfigManager();
  }

  public async construct(requestRestart: () => void): Promise<AppCore> {
    this._logger.important("Initiating app from config...");

    await this._configManager.init();

    const appConfig: AppConfig = this._configManager.getConfig();


    const puppetOrchestrator: PuppetOrchestrator = new PuppetOrchestrator();

    for (const pupConfig of appConfig.puppets) {
      const puppet = PuppetFactory.createPuppet(pupConfig);
      puppetOrchestrator.addPuppet(puppet);
    }

    const viewManager = new ViewManager(appConfig.views);

    // The update layout is rooted at the cwd, same as config/db/logs; the db snapshot
    // seam is the database's own backup API, never a file copy.
    const updateManager = new UpdateManager(
      new GitHubReleases(appConfig.update.api_base),
      new UpdateRunner(process.cwd(), (dest) => CoreDatabase.getInstance().backup(dest)),
      requestRestart,
      appConfig.update.fake_migration_versions,
    );

    const orchestratorConf: AppCoreConfig = {
      puppetOrchestrator: puppetOrchestrator,
      webServer: new WebServer(appConfig.web),
      uiManager: new UiManager(),
      systemManager: new SystemManager(),
      updateManager: updateManager,
      viewManager: viewManager,
      viewServer: new ViewServer(viewManager), // transport for the views; reacts to the manager's events
    }

    return new AppCore(orchestratorConf);

  }
  
}