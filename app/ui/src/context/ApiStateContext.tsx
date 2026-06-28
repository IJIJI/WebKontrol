import { type JSX, createContext, useContext, useState } from "react";
import type { WebServerState } from "../../../src/webServer/model"
import type { PuppetKey, PuppetRuntimeConfigInput } from "../../../src/puppet/schema";
import type { SystemConfig } from "../../../src/system/schema";
import type { PuppetInfoBundle } from "../../../src/puppet/model";


// TODO: This is pretty much the same as the webserver mutation handlers, but I don't think it will be in the future. Check how to best keep in sync.
interface ApiState {
  state: WebServerState;
  callBacks: {
    puppet: {
      setRuntime: (id: PuppetKey, runtime: PuppetRuntimeConfigInput) => Promise<void>;
    },
    system: {
      setConfig: (config: SystemConfig) => Promise<void>;
      // update: {
      //   check: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
      //   apply: (ref: string, type: 'release' | 'branch') => Promise<void>; // TODO: Check arguments
      //   getStatus: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
      // }
    }
  }
}

const ApiStateContext = createContext<ApiState | null>(null);

export function ApiStateProvider({ children }: { children: JSX.Element }): JSX.Element {

  const [puppets, setPuppets] = useState<PuppetInfoBundle[]>([]);

  return (<></>);
}

// Hook:
export function useApi(): ApiState {
  const context = useContext(ApiStateContext);
  if (!context)
    throw new Error("useApi can only be used within the ApiStateProvider! Context was not present.");
  return context;
}