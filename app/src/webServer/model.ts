import type { PuppetInfoBundle } from "../puppet/model";
import type { PuppetKey, PuppetRuntimeConfigInput } from "../puppet/schema";
import type { SystemBundle } from "../system/model";
import type { SystemConfig } from "../system/schema";

export interface WebServerState {
  puppets: PuppetInfoBundle[];
  system: SystemBundle;
}

export interface WebServerMutationHandlers {
  puppet: {
    updateRuntime: (
      id: PuppetKey,
      runtime: Partial<PuppetRuntimeConfigInput>,
    ) => Promise<void>;
  };
  system: {
    updateConfig: (config: Partial<SystemConfig>) => Promise<void>;

    update: {
      check: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
      apply: (ref: string, type: "release" | "branch") => Promise<void>; // TODO: Check arguments
      getStatus: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
    };
  };
}
