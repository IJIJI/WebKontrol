import express from "express";
import ViteExpress from "vite-express";
import type http from "http";
import { Logger } from "../logging/Logger";
import { WebServerStatus, type AppInfo, type RouteHandler, type RouteMethod, type RouteRegistrar, type SseConnection, type SseHandler, type WebServerMutationHandlers, type WebServerState } from "./model";
import { jsonReplacer } from "../helpers/json";
import {
  PuppetPatchSchema,
  ViewKeyPackageShape,
  WebServerConfigSchema,
  type WebServerConfig,
  type WebServerConfigInput,
} from "./schema";
import { UiRuntimeShape } from "../ui/schema";
import { SystemRuntimeShape } from "../system/schema";
import { PuppetKeySchema } from "../puppet/types/schema";
import { AnyViewConfigSchema, ViewKeySchema, ViewManagerRuntimeShape } from "../views/types/schema";
import { PuppetOrchestratorRuntimeShape } from "../orchestration/puppet/schema";

export class WebServer implements RouteRegistrar {
  private _app = express();
  private _server!: http.Server;
  private _logger = new Logger(["WEB", "SERVER"]);

  private _config: WebServerConfig;

  private _state: WebServerState | null = null;

  private _handlers!: WebServerMutationHandlers;

  private _sseClients: Set<express.Response> = new Set();

  constructor(config: WebServerConfigInput) {
    this._config = WebServerConfigSchema.parse(config);
    // Register body parsing up front. It is needed for the registrar routes, which are added before start.
    // Without this registered routes can not parse the request body.
    this._app.use(express.json());
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
    this._logger.info(`Updated state for ${this._sseClients.size} clients.`);
    this._logger.debug(`New state:`, state);
  }

  public setHandlers(handlers: WebServerMutationHandlers): void {
    this._handlers = handlers;
  }

  /** The base URL the app serves on (used to build view targets the puppet navigates to). */
  public getServeBase(): string {
    return `http://localhost:${this._config.port}`;
  }

  /**
   * Register a route. Components (views now, plugins later) use this instead of the
   * WebServer hardcoding their paths. Must be called before start() so it lands
   * ahead of the ViteExpress SPA catch-all. The handler returns a framework-agnostic
   * RouteResponse, mapped to express here.
   */
  public registerRoute(method: RouteMethod, path: string, handler: RouteHandler): void {
    this._app[method](path, (req, res, next) => {
      void this._runRoute(handler, req, res, next);
    });
    this._logger.debug(`Registered ${method.toUpperCase()} ${path}`);
  }

  /**
   * Register a long-lived SSE stream. Sets the event-stream headers, keeps the
   * connection alive with periodic pings, and hands the handler a framework-agnostic
   * SseConnection. Must be called before start() so it lands ahead of the SPA catch-all.
   */
  public registerSse(path: string, handler: SseHandler): void {
    this._app.get(path, (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const ping = setInterval(() => this._sseWrite(res, `: ping\n\n`), this._config.sse.ping_interval);
      req.on("close", () => clearInterval(ping));

      const connection: SseConnection = {
        send: (event, data) => this._sseWrite(res, `event: ${event}\ndata: ${data}\n\n`),
        close: () => res.end(),
        onClose: (cb) => req.on("close", cb),
      };

      try {
        handler(
          { params: req.params as Record<string, string>, query: req.query, body: undefined },
          connection,
        );
      } catch (error) {
        this._logger.error(`SSE handler threw for ${path}:`, error);
        clearInterval(ping);
        res.end();
      }
    });
    this._logger.debug(`Registered SSE ${path}`);
  }

  /** Write to an SSE response, tolerating a connection that closed between checks and this write. */
  private _sseWrite(res: express.Response, chunk: string): void {
    if (res.writableEnded) return; // client already gone; the close handler cleaned up
    try {
      res.write(chunk);
    } catch (error) {
      // Routine (the client disconnected mid-write), so debug — but never silent.
      this._logger.debug("Dropped SSE write to a closed connection:", error);
    }
  }

  private async _runRoute( // TODO: ss has no seperate function. Should it or should this not.
    handler: RouteHandler,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> {
    try {
      const result = await handler({
        params: req.params as Record<string, string>,
        query: req.query,
        body: req.body as unknown,
      });
      if (result.passthrough) {
        // Handler declined; continue the middleware chain.
        return next();
      }
      if (result.headers) {
        for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
      }
      if (result.redirect !== undefined) {
        res.redirect(result.status ?? 302, result.redirect);
      } else if (result.body !== undefined) {
        if (result.contentType) res.type(result.contentType);
        res.status(result.status ?? 200).send(result.body);
      } else {
        res.status(result.status ?? 204).end();
      }
    } catch (error) {
      this._logger.error(`Route handler failed for ${req.method} ${req.path}:`, error);
      if (!res.headersSent) res.status(500).end();
    }
  }

  public async start(): Promise<void> {
    if (this._handlers === undefined) {
      throw new Error("Handlers where not set before the server was started!");
    }

    this._logger.info("Starting WebServer...");

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
        system: this._state?.info.system,
      }
      res.json(info); // TODO: Different payload? If so, make /api/system this._state.system again.
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

    this._app.patch("/api/config/system", async (req, res) => {
      const result = SystemRuntimeShape.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }

      try {
        await this._handlers.system.updateRuntime(result.data);
        res.status(204).send();
      } catch (e) {
        this._logger.error("Failed to update core runtime:", e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to update core config",
        });
      }
    });

    this._app.patch("/api/config/puppet", async (req, res) => { // TODO: Correct path? It is for the puppet orchestrator
      const result = PuppetOrchestratorRuntimeShape.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }

      try {
        await this._handlers.puppet.updateOrchestratorRuntime(result.data);
        res.status(204).send();
      } catch (e) {
        this._logger.error("Failed to update puppet orchestator runtime:", e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to update puppet orchestator config",
        });
      }
    });

    this._app.get("/api/puppets", (_req, res) => {
      res.json(this._state?.puppets);
    });

    this._app.patch("/api/puppets/:id", async (req, res) => {
      const resultId = PuppetKeySchema.safeParse(req.params.id);

      if (!resultId.success) {
        return res.status(400).json({ errors: resultId.error.format() });
      }

      const resultBody = PuppetPatchSchema.safeParse(req.body);

      if (!resultBody.success) {
        return res.status(400).json({ errors: resultBody.error.format() });
      }

      try {
        const { appearance, ...runtimeUpdate } = resultBody.data;
        if (Object.keys(runtimeUpdate).length > 0)
          await this._handlers.puppet.updateRuntime(resultId.data, runtimeUpdate);
        if (appearance !== undefined)
          await this._handlers.puppet.updateAppearance(resultId.data, appearance);
        res.status(204).send();
      } catch (e) {
        this._logger.error("Failed to update puppet:", resultId.data, e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to update puppet",
        });
      }
    });

    this._app.post("/api/puppets/:id/assign", async (req, res) => { // TODO: Correct path?
      const resultId = PuppetKeySchema.safeParse(req.params.id);

      if (!resultId.success) {
        return res.status(400).json({ errors: resultId.error.format() });
      }

      const resultBody = ViewKeyPackageShape.safeParse(
        req.body,
      );

      if (!resultBody.success) {
        return res.status(400).json({ errors: resultBody.error.format() });
      }

      try {
        await this._handlers.puppet.assignView(
          resultId.data,
          resultBody.data.view,
        );
        res.status(204).send();
        this._logger.info(
          `Assigned view ${resultBody.data.view} to puppet ${resultId.data}`
        );
      } catch (e) {
        this._logger.error("Failed to assign view to puppet:", resultId.data, e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to assign view to puppet",
        });
      }
    });

    this._app.delete("/api/puppets/:id/unassign", async (req, res) => { // TODO: Correct path?
      const resultId = PuppetKeySchema.safeParse(req.params.id);

      if (!resultId.success) {
        return res.status(400).json({ errors: resultId.error.format() });
      }


      try {
        await this._handlers.puppet.unassignView(
          resultId.data,
        );
        res.status(204).send();
        this._logger.info(
          `Unassigned view from puppet ${resultId.data}`
        );
      } catch (e) {
        this._logger.error("Failed to unassign view from puppet:", resultId.data, e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to unassign view from puppet",
        });
      }
    });

    this._app.post("/api/views", async (req, res) => {
      const result = AnyViewConfigSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      try {
        const key = await this._handlers.view.create(result.data);
        res.status(201).json({ key });
        this._logger.info(`Created view ${key}.`);
      } catch (e) {
        this._logger.error("Failed to create view:", e);
        res.status(500).json({ error: e instanceof Error ? e.message : "Failed to create view" });
      }
    });

    this._app.patch("/api/views/:key", async (req, res) => {
      const resultKey = ViewKeySchema.safeParse(req.params.key);
      if (!resultKey.success) {
        return res.status(400).json({ errors: resultKey.error.format() });
      }
      const resultBody = AnyViewConfigSchema.safeParse(req.body);
      if (!resultBody.success) {
        return res.status(400).json({ errors: resultBody.error.format() });
      }
      try {
        await this._handlers.view.update(resultKey.data, resultBody.data);
        res.status(204).send();
        this._logger.info(`Updated view ${resultKey.data}.`);
      } catch (e) {
        this._logger.error("Failed to update view:", resultKey.data, e);
        res.status(500).json({ error: e instanceof Error ? e.message : "Failed to update view" });
      }
    });

    this._app.delete("/api/views/:key", async (req, res) => {
      const resultKey = ViewKeySchema.safeParse(req.params.key);
      if (!resultKey.success) {
        return res.status(400).json({ errors: resultKey.error.format() });
      }
      try {
        await this._handlers.view.delete(resultKey.data);
        res.status(204).send();
        this._logger.info(`Deleted view ${resultKey.data}.`);
      } catch (e) {
        this._logger.error("Failed to delete view:", resultKey.data, e);
        res.status(500).json({ error: e instanceof Error ? e.message : "Failed to delete view" });
      }
    });

    this._app.patch("/api/config/view", async (req, res) => {
      const result = ViewManagerRuntimeShape.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }

      try {
        await this._handlers.view.updateRuntime(result.data);
        res.status(204).send();
      } catch (e) {
        this._logger.error("Failed to update view runtime:", e);
        res.status(500).json({
          error: e instanceof Error ? e.message : "Failed to update view config",
        });
      }
    });

    this._app.patch("/api/config/ui", async (req, res) => {
      const result = UiRuntimeShape.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }

      try {
        await this._handlers.ui.updateRuntime(result.data);
        res.status(204).send();
      } catch (e) {
        this._logger.error("Failed to update ui runtime:", e);
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
