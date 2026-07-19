import type { PuppetOrchestratorRuntime } from "../orchestration/puppet/schema";
import type { PuppetDataBundle } from "../puppet/types/model";
import type { PuppetKey, PuppetRuntime } from "../puppet/types/schema";
import type { SystemInfo } from "../system/model";
import type { SystemRuntime } from "../system/schema";
import type { UiRuntime } from "../ui/schema";
import type { AnyViewConfig, ViewKey } from "../views/types/schema";

export interface WebServerRuntimeState {// Only Runtime Configs. Standard configs are done from the config file.
  system: SystemRuntime;
  puppetOrchestrator: PuppetOrchestratorRuntime;
  ui:  UiRuntime;
}
export interface WebServerInfoState {
  system: SystemInfo;
}

export interface WebServerState {
  puppets: PuppetDataBundle[];
  views: Record<ViewKey, AnyViewConfig>;
  runtime: WebServerRuntimeState; // TODO: Rename to runtime?
  info: WebServerInfoState;
}

export interface PuppetWebhandlers {
  updateOrchestratorRuntime: (
    runtime: Partial<PuppetOrchestratorRuntime>,
  ) => Promise<void>;
  updateRuntime: (
    id: PuppetKey,
    runtime: Partial<PuppetRuntime>,
  ) => Promise<void>;
}
export interface SystemWebhandlers {
  updateRuntime: (config: Partial<SystemRuntime>) => void | Promise<void>;
}
export interface UpdateWebhandlers {
  check: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
  apply: (ref: string, type: "release" | "branch") => Promise<void>; // TODO: Check arguments
  getStatus: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
}
export interface UiWebhandlers {
  updateRuntime: (runtime: Partial<UiRuntime>) => void | Promise<void>;
}
export interface ViewWebhandlers {
  create: (config: AnyViewConfig) => Promise<ViewKey>;
  update: (key: ViewKey, config: AnyViewConfig) => Promise<void>;
  delete: (key: ViewKey) => Promise<void>;
}

export interface WebServerMutationHandlers { // TODO: UiManager to manage ui settings?
  system: SystemWebhandlers;
  update: UpdateWebhandlers;
  ui: UiWebhandlers;
  puppet: PuppetWebhandlers;
  view: ViewWebhandlers;
}

//* Route registration (the seed of plugin HTTP endpoints):
export type RouteMethod = "get" | "post" | "put" | "patch" | "delete";

export interface RouteRequest {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown; // untrusted; a handler that reads it must validate (e.g. with zod) first
}

// A framework-agnostic response a route handler returns; WebServer maps it to express.
export interface RouteResponse {
  status?: number;
  redirect?: string; // if set, redirect here (status defaults to 302)
  body?: string;
  contentType?: string; // for body, e.g. "text/html"
  headers?: Record<string, string>; // extra response headers, e.g. Cache-Control
  // If set, the handler declines to respond and the request continues down the
  // middleware chain (e.g. a route that conditionally falls through to the SPA/Vite
  // HTML middleware). No current consumer, but kept as an extension point for plugin
  // routes that want to hand off. Mutually exclusive with a body/redirect.
  // TODO: Check if this can be done cleaner? E.g. an union type of different responses?
  passthrough?: boolean;
}

export type RouteHandler = (req: RouteRequest) => RouteResponse | Promise<RouteResponse>;

// A live Server-Sent-Events connection, framework-agnostic; WebServer maps it to express.
export interface SseConnection {
  /** Send a named SSE event with a string (usually JSON) payload. */
  send(event: string, data: string): void;
  /** End the stream. */
  close(): void;
  /** Register a callback for when the client disconnects. */
  onClose(callback: () => void): void;
}

export type SseHandler = (req: RouteRequest, connection: SseConnection) => void;

// What WebServer exposes so components (views now, plugins later) register their own routes.
export interface RouteRegistrar {
  registerRoute(method: RouteMethod, path: string, handler: RouteHandler): void;
  /** Register a long-lived Server-Sent-Events stream (keep-alive is handled by the server). */
  registerSse(path: string, handler: SseHandler): void;
}

export enum WebServerStatus {
  SETTING_UP = "Setting up...",
  ONLINE = "Online",
  FAILED = "Failed",
};

export interface AppInfo {
  status: {
    key: keyof typeof WebServerStatus;
    message: WebServerStatus;
  }
  system?: SystemInfo;
}
