import type { PuppetInfoBundle } from "../puppet/model";
import type { PuppetKey, PuppetRuntimeConfigInput } from "../puppet/schema";


export interface WebServerState {
  puppets: PuppetInfoBundle[];
}

export interface WebServerMutationHandlers {
  setPuppetRuntime: (id: PuppetKey, runtime: PuppetRuntimeConfigInput) => Promise<void>;
}