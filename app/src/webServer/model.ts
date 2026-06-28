import type { PuppetInfoBundle } from "../puppet/model";
import type { PuppetKey, PuppetRuntimeConfigInput } from "../puppet/schema";
import type { SystemBundle } from "../system/model";



export interface WebServerState {
  puppets: PuppetInfoBundle[];
  system: SystemBundle;
};

export interface WebServerMutationHandlers {
  setPuppetRuntime: (id: PuppetKey, runtime: PuppetRuntimeConfigInput) => Promise<void>;
}


