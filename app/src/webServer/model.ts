import type { PuppetInfoBundle } from "../puppet/model";
import type { PuppetKey, PuppetRuntimeConfigInput } from "../puppet/schema";
import type { SystemInfo } from "../system/model";
import type { SystemConfig } from "../system/schema";


export interface WebServerState {
  puppets: PuppetInfoBundle[];
  system: {
    info: SystemInfo,
    config: SystemConfig,
  }
}

export interface WebServerMutationHandlers {
  setPuppetRuntime: (id: PuppetKey, runtime: PuppetRuntimeConfigInput) => Promise<void>;
}


