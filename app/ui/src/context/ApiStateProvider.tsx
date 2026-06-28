import { ReactNode } from "react";
import { WebServerState } from "../../../src/webServer/model"
import { PuppetKey, PuppetRuntimeConfigInput } from "../../../src/puppet/schema";
import { SystemConfig } from "../../../src/system/schema";


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



export function ApiStateProvider({ children }: { children: ReactNode }) {
  return (<></>);
}