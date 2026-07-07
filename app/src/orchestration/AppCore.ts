import { Logger } from "../logging/Logger";
import type { SystemManager } from "../system/SystemManager";
import type { UiManager } from "../ui/UiManager";
import type { WebServer } from "../webServer/WebServer";
import type { PuppetOrchestrator } from "./puppet/PuppetOrchestrator";

export interface AppCoreConfig {
  systemManager: SystemManager;
  puppetOrchestrator: PuppetOrchestrator;
  webServer: WebServer;
  uiManager: UiManager;
}

export class AppCore { // TODO: Move every non-puppet management from the appcore to this.
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _isInit: boolean = false;

  private _systemManager: SystemManager;

  private _puppetOrchestrator: PuppetOrchestrator;

  private _webServer: WebServer;
  private _uiManager: UiManager;

  constructor(config: AppCoreConfig) {
    this._systemManager = config.systemManager;
    this._puppetOrchestrator = config.puppetOrchestrator;
    this._webServer = config.webServer;
    this._uiManager = config.uiManager;
  }

  public getPuppetManager(): PuppetOrchestrator {
    return this._puppetOrchestrator;
  }

  public async init(): Promise<void> {
    if(this._isInit){
      this._logger.warn("Init called on already initialised AppCore. Disregarding.");
    }
    this._logger.important("Starting AppCore...");

    //TODO: Wire WebServer, ...
    await this._systemManager.init();

    await this._puppetOrchestrator.init();

    await this._uiManager.init();
    
    this._webServer.setHandlers({
      system: this._systemManager.getHandlers(),
      update: { // TODO: UpdateManager
        check: async (): Promise<void> => {
          this._logger.important(`update.check() handler called.`);
        },
        apply: async (
          ref: string,
          type: "release" | "branch",
        ): Promise<void> => {
          this._logger.important(
            `update.apply() handler called with ref: ${ref} of type: ${type}`,
          );
        },
        getStatus: async (): Promise<void> => {
          this._logger.important(`update.getStatus() handler called.`);
        },
      },
      puppet: this._puppetOrchestrator.getHandlers(),
      ui: this._uiManager.getHandlers(),
    });
    await this._webServer.start(); // TODO rename to init? Or split?
    await this._sysncWebState();
  }

  private async _sysncWebState(): Promise<void> {

    this._logger.debug(`Syncing state to webserver...`);
    this._webServer.setState({
      puppets: await this._puppetOrchestrator.getPuppetInfoBundles(),
      runtime: {
        system: this._systemManager.getRuntime(),
        ui: this._uiManager.getRuntime(),
      },
      info: {
        system: this._systemManager.getInfo(),
      }
    });
  }
  


}
