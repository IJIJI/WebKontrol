import type { CoreInfo } from "../core/model";
import type { CoreRuntimeConfig } from "../core/schema";
import { Logger } from "../logging/Logger";
import { AppCoreStore } from "../storage/AppCoreStore";
import type { UiManager } from "../ui/UiManager";
import type { WebServer } from "../webServer/WebServer";


export class Orchestrator { // TODO: Move every non-puppet management from the appcore to this.
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _hasStarted: boolean = false;

  private _webServer!: WebServer;
  private _uiManager!: UiManager;

  private _info: CoreInfo = {
    start_moment: Date.now(),
  };

  private _config: CoreRuntimeConfig = {
    system_name: "WebKontrol",
  };

  protected _store: AppCoreStore = new AppCoreStore();

}
