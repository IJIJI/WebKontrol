import { Logger } from "../logging/Logger";
import type { SystemManager } from "../system/SystemManager";
import type { UiManager } from "../ui/UiManager";
import type { WebServerState } from "../webServer/model";
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

  private _webState!: WebServerState;

  constructor(config: AppCoreConfig) {
    this._systemManager = config.systemManager;
    this._puppetOrchestrator = config.puppetOrchestrator;
    this._webServer = config.webServer;
    this._uiManager = config.uiManager;

    this._systemManager.on('info_update', (info) => this._updateState({info: { ...this._webState.runtime, system: info }}));
    this._systemManager.on('runtime_update', (runtime) => this._updateState({runtime: { ...this._webState.runtime, system: runtime }}));
    
    this._puppetOrchestrator.on('runtime_update', (runtime) => this._updateState({runtime: { ...this._webState.runtime, puppetOrchestrator: runtime }}));
    this._puppetOrchestrator.on('puppet_update', (puppets) => this._updateState({ puppets: puppets }));

    this._uiManager.on('runtime_update', (runtime) => this._updateState({runtime: { ...this._webState.runtime, ui: runtime }}));
  }

  public getPuppetManager(): PuppetOrchestrator {
    return this._puppetOrchestrator;
  }

  public async init(): Promise<void> {
    if(this._isInit){
      this._logger.warn("Init called on already initialised AppCore. Disregarding.");
    }
    this._logger.important("Starting AppCore...");

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


    this._updateState({
      puppets: this._puppetOrchestrator.getPuppetBundles(),
      runtime: {
        system: this._systemManager.getRuntime(),
        puppetOrchestrator: this._puppetOrchestrator.getRuntime(),
        ui: this._uiManager.getRuntime(),
      },
      info: {
        system: this._systemManager.getInfo(),
      }
    });
  }

  private _updateState(state: Partial<WebServerState>) {
    this._webState = {...this._webState, ...state};
    this._logger.debug(`Updating webstate and syncing to webserver...`);
    try {
      this._webServer.setState(this._webState); 
    } catch (error) {
      this._logger.error("Failed to sync state to webserver:", error);
    }
  }

  


}
