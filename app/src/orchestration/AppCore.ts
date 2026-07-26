import { Logger } from "../logging/Logger";
import type { SystemManager } from "../system/SystemManager";
import type { UiManager } from "../ui/UiManager";
import type { WebServerState } from "../webServer/model";
import type { WebServer } from "../webServer/WebServer";
import type { PuppetOrchestrator } from "./puppet/PuppetOrchestrator";
import type { ViewManager } from "../views/ViewManager";
import type { ViewServer } from "../views/ViewServer";

export interface AppCoreConfig {
  systemManager: SystemManager;
  puppetOrchestrator: PuppetOrchestrator;
  webServer: WebServer;
  uiManager: UiManager;
  viewManager: ViewManager;
  viewServer: ViewServer;
}

export class AppCore { // TODO: Move every non-puppet management from the appcore to this.
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _isInit: boolean = false;

  private _systemManager: SystemManager;

  private _puppetOrchestrator: PuppetOrchestrator;

  private _webServer: WebServer;
  private _uiManager: UiManager;
  private _viewManager: ViewManager;
  private _viewServer: ViewServer;

  private _webState!: WebServerState;

  constructor(config: AppCoreConfig) {
    this._systemManager = config.systemManager;
    this._puppetOrchestrator = config.puppetOrchestrator;
    this._webServer = config.webServer;
    this._uiManager = config.uiManager;
    this._viewManager = config.viewManager;
    this._viewServer = config.viewServer;

    this._updateState({
      puppets: this._puppetOrchestrator.getPuppetBundles(),
      views: this._viewManager.getViewConfigs(),
      runtime: {
        system: this._systemManager.getRuntime(),
        puppetOrchestrator: this._puppetOrchestrator.getRuntime(),
        ui: this._uiManager.getRuntime(),
        view: this._viewManager.getRuntime(),
      },
      info: {
        system: this._systemManager.getInfo(),
      }
    });

    this._systemManager.on('info_update', (info) => this._updateState({info: { ...this._webState.runtime, system: info }}));
    this._systemManager.on('runtime_update', (runtime) => this._updateState({runtime: { ...this._webState.runtime, system: runtime }}));

    this._puppetOrchestrator.on('runtime_update', (runtime) => this._updateState({runtime: { ...this._webState.runtime, puppetOrchestrator: runtime }}));
    this._puppetOrchestrator.on('puppet_update', (puppets) => this._updateState({ puppets: puppets }));

    this._uiManager.on('runtime_update', (runtime) => this._updateState({runtime: { ...this._webState.runtime, ui: runtime }}));

    // Re-sync the view list into the state on any view change (create/edit/delete).
    const syncViews = (): void => this._updateState({ views: this._viewManager.getViewConfigs() });
    this._viewManager.on('view_added', syncViews);
    this._viewManager.on('view_updated', syncViews);
    this._viewManager.on('view_removed', syncViews);
    this._viewManager.on('runtime_update', (runtime) => this._updateState({runtime: { ...this._webState.runtime, view: runtime }}));
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

    // Views before puppets: the orchestrator resolves each puppet's assigned view into a
    // target during its own init, so the ViewManager must already hold the views.
    await this._viewManager.init();
    this._updateState({ views: this._viewManager.getViewConfigs() }); // seed loaded views (init emits no events)
    await this._viewServer.init(); // build the block renderer bundle before serving
    this._puppetOrchestrator.setViewContext(this._viewManager, this._webServer.getServeBase());

    // Keep puppets in sync with view edits: reload only when the served target actually
    // changed (block content edits update in place over SSE), and always on removal.
    this._viewManager.on('view_updated', (key, puppetReload) => {
      if (puppetReload) void this._puppetOrchestrator.onViewUpdated(key);
    });
    this._viewManager.on('view_removed', (key) => void this._puppetOrchestrator.onViewRemoved(key));

    await this._puppetOrchestrator.init();

    await this._uiManager.init();

    this._viewServer.registerRoutes(this._webServer); // before start() → lands ahead of the SPA catch-all

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
      view: this._viewManager.getHandlers(),
    });
    await this._webServer.start(); // TODO rename to init? Or split?


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
