import express from "express";
import ViteExpress from "vite-express";
import type http from "http";
import { Logger } from "../logging/Logger";
import type { WebServerMutationHandlers, WebServerState } from "./model";
import { jsonReplacer } from "../helpers/json";
import {
  WebServerConfigSchema,
  type WebServerConfig,
  type WebServerConfigInput,
} from "./schema";
import { SystemConfigSchema } from "../system/schema";
import { PuppetKeySchema, PuppetRuntimeConfigSchema } from "../puppet/schema";

export class WebServer {
  private _app = express();
  private _server!: http.Server;
  private _logger = new Logger(["WEB", "SERVER"]);

  private _config: WebServerConfig;

  private _state: WebServerState = {
    puppets: [],
    system: {
      info: {
        start_moment: 0,
      },
      config: {
        system_name: "WebKontrol",
      },
    },
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

  private get _getSsePayload() {
    return `data: ${JSON.stringify(this._state, jsonReplacer)}\n\n`; // TODO: Right format?
  }

  public setState(state: WebServerState): void {
    this._state = state;
    if (this._sseClients.size > 0) {
      for (const res of this._sseClients) res.write(this._getSsePayload);
    }
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
      res.json(this._state.system.info); // TODO: Different payload? If so, make /api/system this._state.system again.
    });

    this._app.get("/api/state", (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      res.write(this._getSsePayload);
      this._sseClients.add(res);
      const ping = setInterval(() => res.write(": ping\n\n"), 25_000); // TODO: This the right ping interval? It seems high.
      req.on("close", () => {
        clearInterval(ping);
        this._sseClients.delete(res);
      });
    });

    this._app.get("/api/system", (_req, res) => {
      res.json(this._state.system.config);
    });

    this._app.patch("/api/system/config", async (req, res) => {
      const result = SystemConfigSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }

      await this._handlers.system.updateConfig(result.data);
    });

    this._app.get("/api/puppets", (_req, res) => {
      res.json(this._state.puppets);
    });

    this._app.patch("/api/puppets/:id", async (req, res) => {
      // TODO: Update puppet runtime config
      const resultId = PuppetKeySchema.safeParse(req.params.id);

      if (!resultId.success) {
        return res.status(400).json({ errors: resultId.error.format() });
      }

      const resultBody = PuppetRuntimeConfigSchema.partial().safeParse(req.body);

      if (!resultBody.success) {
        return res.status(400).json({ errors: resultBody.error.format() });
      }

      try {
        await this._handlers.puppet.updateRuntime(resultId.data, resultBody.data);
        res.status(204).send();
        this._logger.info(
          `Updated puppet ${resultId.data} runtime. New:`,
          resultBody.data,
        );
      } catch (e) {
        this._logger.error("Failed to update producer:", resultId.data, e);
        res
          .status(500)
          .json({
            error: e instanceof Error ? e.message : "Failed to update producer",
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
