import express from "express";
import ViteExpress from "vite-express";
import type http from "http";
import { Logger } from "../logging/Logger";
import { WebServerStatus, type AppInfo, type WebServerMutationHandlers, type WebServerState } from "./model";
import { jsonReplacer } from "../helpers/json";
import {
  WebServerConfigSchema,
  type WebServerConfig,
  type WebServerConfigInput,
} from "./schema";
import { PuppetKeySchema, PuppetRuntimeConfigSchema } from "../puppet/schema";
import { CoreRuntimeConfigSchema } from "../core/schema";
import { UiRuntimeConfigSchema } from "../ui/schema";

export class WebServer {
  private _app = express();
  private _server!: http.Server;
  private _logger = new Logger(["WEB", "SERVER"]);

  private _config: WebServerConfig;

  private _state: WebServerState | null = null;

  private _handlers!: WebServerMutationHandlers;

  private _sseClients: Set<express.Response> = new Set();

  protected _isInit = false;

  constructor(config: WebServerConfigInput) {
    this._config = WebServerConfigSchema.parse(config);
  }

  private get _getSseDataPayload() {
    return `event: data\ndata: ${JSON.stringify(this._state, jsonReplacer)}\n\n`;
  }
  private get _getSsePingPayload() {
    return `event: ping\ndata: ${Date.now()}\n\n`;
  }

  public get hasState(): boolean { // TODO: Convert into a getStatus that returns a WebServerStatus
    return this._state !== null;
  }

  public setState(state: WebServerState): void {
    this._state = state;
    if (this._sseClients.size > 0) {
      for (const res of this._sseClients) res.write(this._getSseDataPayload);
    }
    this._logger.info(
      `Updated state for ${this._sseClients.size} clients. New state:`,
      state,
    );
  }

  public setHandlers(handlers: WebServerMutationHandlers): void {
    this._handlers = handlers;
  }

  public async start(): Promise<void> {
    if (this._handlers === undefined) {
      // TODO: Continue without and set state to ERROR, until they are set?
      throw new Error("Handlers where not set before the server was started!"); // TODO: Check if this should error. Check if there should be an info for the state.
    }

    this._logger.info("Starting WebServer...");

    this._app.use(express.json());
    this._app.set("json replacer", jsonReplacer);

    // Middleware that returns the still setting up message before the state is set:
    this._app.use("/api", (req, res, next) => {
      if( this.hasState || req.path == "/state" ) return next();
      res.setHeader("Retry-After", "2");
      res.status(503).json({ 
        message: "Server starting...",
        error: "SERVER_NOT_STARTED_YET",
      });
    });

    // TODO: Check if (when implemented) production is loaded correctly.
    ViteExpress.config({
      verbosity: ViteExpress.Verbosity.Silent,
      mode:
        process.env.NODE_ENV === "production" ? "production" : "development",
    });

    this._registerRoutes();

    this._server = await new Promise((res) => {
      const server = ViteExpress.listen(this._app, this._config.port, () => {
        this._logger.important(
          `Admin server running on http://localhost:${this._config.port}`,
        );
        res(server);
      });
    });

    this._logger.info("Admin server started.");
  }

  public async destroy(): Promise<void> {
    if (!this._isInit) {
      this._logger.warn(
        "Tried destroying an uninitialised WebServer. Ignoring.",
      );
    }

    this._isInit = false; // TODO: Add isDestroying variables?

    this._logger.info("Attempting graceful shutdown...");

    if (!this._server) {
      this._logger.warn(
        "Tried destroying WebServer, but the http.Server not running. Ignoring.",
      );
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const forceCloseTimeout = setTimeout(() => {
        this._logger.warn("Shutdown timeout reached. Forcing exit.");
        // Forcefully close all connections
        this._server?.closeAllConnections();
      }, 3000);

      const forceRejectTimeout = setTimeout(() => {
        this._logger.warn("Destroy timeout reached. Marking as unsuccessfull.");
        reject(new Error("Failed to destroy within timeout."));
      }, 5000);

      this._server.close((err) => {
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

  private _registerRoutes(): void {
    this._app.get("/api/info", (_req, res) => {
      const info: AppInfo = {
        status: this.hasState ? {
          key: "ONLINE",
          message: WebServerStatus.ONLINE,
        } : {
          key: "SETTING_UP",
          message: WebServerStatus.SETTING_UP,
        },
        core: {
          info: this._state?.info.core,
          config: this._state?.config.core,
        }
      }
      res.json(this._state?.info); // TODO: Different payload? If so, make /api/system this._state.system again.
    });

    this._app.get("/api/state", (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      if(this.hasState)
        res.write(this._getSseDataPayload);
      this._sseClients.add(res);
      this._logger.debug(
        `New client connected to /api/state. Now a total of ${this._sseClients.size} clients are listening.`,
      );
      const ping = setInterval(
        () => res.write(this._getSsePingPayload),
        this._config.sse.ping_interval,
      );
      req.on("close", () => {
        clearInterval(ping);
        this._sseClients.delete(res);
        this._logger.debug(
          `A client disconnected to /api/state. Now a total of ${this._sseClients.size} clients are listening.`,
        );
      });
    });

    this._app.patch("/api/config/core", async (req, res) => {
      const result = CoreRuntimeConfigSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }

      try {
        await this._handlers.core.updateConfig(result.data);
        res.status(204).send();
      } catch (e) {
        this._logger.error("Failed to update core config:", e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to update core config",
        });
      }
    });

    this._app.get("/api/puppets", (_req, res) => {
      res.json(this._state?.puppets);
    });

    this._app.patch("/api/puppets/:id", async (req, res) => {
      // TODO: Update puppet runtime config
      const resultId = PuppetKeySchema.safeParse(req.params.id);

      if (!resultId.success) {
        return res.status(400).json({ errors: resultId.error.format() });
      }

      const resultBody = PuppetRuntimeConfigSchema.partial().safeParse(
        req.body,
      );

      if (!resultBody.success) {
        return res.status(400).json({ errors: resultBody.error.format() });
      }

      try {
        await this._handlers.puppet.updateRuntime(
          resultId.data,
          resultBody.data,
        );
        res.status(204).send();
        this._logger.info(
          `Updated puppet ${resultId.data} runtime. New:`,
          resultBody.data,
        );
      } catch (e) {
        this._logger.error("Failed to update producer:", resultId.data, e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to update producer",
        });
      }
    });

    this._app.patch("/api/config/ui", async (req, res) => {
      const result = UiRuntimeConfigSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }

      try {
        await this._handlers.ui.updateConfig(result.data);
        res.status(204).send();
      } catch (e) {
        this._logger.error("Failed to update ui config:", e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to update ui config",
        });
      }
    });

    // ? Update
    // TODO: IMPLEMENT!
    // this.app.get("/api/update/status", (_req, res) => {
    //   res.json(this.updateManager.getStatus());
    // });

    // this.app.post("/api/update/check", async (_req, res) => {
    //   const status = await this.updateManager.checkForUpdates();
    //   res.json(status);
    // });

    // this.app.post("/api/update/apply", (req, res) => {
    //   const { ref, type } = req.body as { ref: string; type: 'release' | 'branch' };
    //   if (!ref || !type) {
    //     res.status(400).json({ error: "ref and type are required" });
    //     return;
    //   }
    //   res.status(204).send();
    //   this.updateManager.applyUpdate(ref, type).catch((err) => {
    //     this.logger.error("Update failed:", err);
    //   });
    //   this.logger.info(`Update requested: ${type} "${ref}"`);
    // });
  }
}
