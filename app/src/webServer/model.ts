import type { PuppetOrchestratorRuntime } from "../orchestration/puppet/schema";
import type { PuppetDataBundle } from "../puppet/types/model";
import type { PuppetKey, PuppetRuntime } from "../puppet/types/schema";
import type { SystemInfo } from "../system/model";
import type { SystemRuntime } from "../system/schema";
import type { UiRuntime } from "../ui/schema";

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

export interface WebServerMutationHandlers { // TODO: UiManager to manage ui settings?
  system: SystemWebhandlers;
  update: UpdateWebhandlers;
  ui: UiWebhandlers;
  puppet: PuppetWebhandlers;
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
