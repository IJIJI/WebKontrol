import express from "express";
import ViteExpress from "vite-express";
import http from 'http';
import { Logger } from "../logging/Logger";
import type { WebServerMutationHandlers, WebServerState } from "./model";
import { jsonReplacer } from "../helpers/json";
import { WebServerConfigSchema, type WebServerConfig, type WebServerConfigInput } from "./schema";




export class WebServer {
  private _app = express();
  private _server: http.Server;
  private _logger = new Logger(["WEBSERVER"]);

  private _config: WebServerConfig;

  private _state: WebServerState = {
    puppets: [],
    system: {
      info: {
        start_moment: 0
      },
      config: {
        system_name: "WebKontrol"
      }
    }
  };

  private _handlers!: WebServerMutationHandlers;
  
  // private _updateManager: UpdateManager;

  private _sseClients: Set<express.Response> = new Set();

  protected _isInit = false;

  // constructor(updateManager: UpdateManager) {
  //   this.updateManager = updateManager;
  // }
  constructor(config: WebServerConfigInput) {

    this._config = WebServerConfigSchema.parse(config);
  }

  private _serializeState() {
    return JSON.stringify(this._state, jsonReplacer);
  }

  public setState(state: WebServerState): void {
    this._state = state;
    if (this._sseClients.size > 0) {
      const data = `data: ${JSON.stringify(this._serializeState())}\n\n`; // TODO: Right format?
      for (const res of this._sseClients) res.write(data);
    }
  }
  
  public setHandlers(handlers: WebServerMutationHandlers): void {
    this._handlers = handlers;
  }

  public async start(config: WebServerConfig): Promise<void> {
    if (this._handlers !== undefined) {
      // TODO: Continue without and set state to ERROR, until they are set?
      throw new Error("Handlers where not set before the server was started!"); // TODO: Check if this should error. Check if there should be an info for the state. 
    }

    this._logger.info("Starting WebServer...");
    
    this._app.use(express.json());
    this._app.set('json replacer', jsonReplacer)

    // TODO: Check if (when implemented) production is loaded correctly.
    ViteExpress.config({ 
      verbosity: ViteExpress.Verbosity.Silent,
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    });

    this._registerRoutes();

    this._server = await new Promise((res) => {
      const server = ViteExpress.listen(this._app, this._config.port, () => {
        this._logger.info(`Admin server running on http://localhost:${this._config.port}`);
        res(server);
      });
    });

    this._logger.info("Admin server started.");
  }

  public async destroy(): Promise<void> {
    if (!this._isInit) {
      this._logger.warn("Tried destroying an uninitialised WebServer. Ignoring.");
    }

    this._isInit = false; // TODO: Add isDestroying variables?

    this._logger.info("Attempting graceful shutdown...");

    await new Promise<void>((resolve, reject) => {
      const forceCloseTimeout = setTimeout(() => {
        this._logger.warn("Shutdown timeout reached. Forcing exit.");
        // Forcefully close all connections
        this._server?.closeAllConnections();
      }, 3000);

      const forceRejectTimeout = setTimeout(() => {
        this._logger.warn("Destroy timeout reached. Marking as unsuccessfull.");
        reject(new Error("Failed to destroy within timeout."))
      }, 5000);

      this._server!.close((err) => {
        clearTimeout(forceCloseTimeout);
        clearTimeout(forceRejectTimeout);
        
        if (err) {
          this._logger.error("Error during server shutdown", err);
          return reject(err);
        }
        
        this._logger.info("Server closed successfully.");
        resolve();
      });
    });
  }
}