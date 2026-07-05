import type { CoreInfo, CoreInfoBundle } from "../core/model";
import type { CoreRuntimeConfig, CoreRuntimeConfigInput } from "../core/schema";
import type { PuppetInfoBundle } from "../puppet/model";
import type { PuppetKey, PuppetRuntimeConfigInput } from "../puppet/schema";
import type { UiRuntimeConfig } from "../types/UiTypes";


export interface WebServerRuntimeConfigState {// Only Runtime Configs. Standard configs are done from the config file.
  core: CoreRuntimeConfig;
  ui: UiRuntimeConfig;
}
export interface WebServerInfoState {
  core: CoreInfo;
}

export interface WebServerState {
  puppets: PuppetInfoBundle[];
  config: WebServerRuntimeConfigState; // TODO: Rename to runtime?
  info: WebServerInfoState;
}

export interface WebServerMutationHandlers { // TODO: UiManager to manage ui settings?
  puppet: {
    updateRuntime: (
      id: PuppetKey,
      runtime: Partial<PuppetRuntimeConfigInput>,
    ) => Promise<void>;
  };
  core: {
    updateConfig: (config: Partial<CoreRuntimeConfigInput>) => void | Promise<void>;
  };
  update: {
    check: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
    apply: (ref: string, type: "release" | "branch") => Promise<void>; // TODO: Check arguments
    getStatus: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
  };
  ui: {
    updateConfig: (config: Partial<UiRuntimeConfig>) => void | Promise<void>;
  }
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
  core?: Partial<CoreInfoBundle>;
}