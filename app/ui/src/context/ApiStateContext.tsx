import {
  type JSX,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { WebServerState } from "../../../src/webServer/model";
import type {
  PuppetKey,
  PuppetRuntimeConfigInput,
} from "../../../src/puppet/schema";
import type { SystemConfig } from "../../../src/system/schema";
import type { PuppetInfoBundle } from "../../../src/puppet/model";
import { SystemBundle } from "../../../src/system/model";

// TODO: This is pretty much the same as the webserver mutation handlers, but I don't think it will be in the future. Check how to best keep in sync.
interface ApiState {
  state: WebServerState;
  callBacks: {
    puppet: {
      setRuntime: (
        id: PuppetKey,
        runtime: PuppetRuntimeConfigInput,
      ) => Promise<void>;
    };
    system: {
      setConfig: (config: SystemConfig) => Promise<void>;
      // update: {
      //   check: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
      //   apply: (ref: string, type: 'release' | 'branch') => Promise<void>; // TODO: Check arguments
      //   getStatus: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
      // }
    };
  };
}

const ApiStateContext = createContext<ApiState | null>(null);

export function ApiStateProvider({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  const [puppets, setPuppets] = useState<PuppetInfoBundle[]>([]); // TODO: Should puppets be in some sort of map? Should it contain a callback to modify that same puppet?
  const [system, setSystem] = useState<Partial<SystemBundle>>({});
  //TODO Check if loading and error are desired in this form.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySSEPayload = useCallback((state: WebServerState) => {
    setPuppets(state.puppets ?? []);
    setSystem(state.system ?? {});

    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    const eventSource = new EventSource("/api/state");
    eventSource.onmessage = (payload: MessageEvent<string>): void =>
      applySSEPayload(JSON.parse(payload.data) as WebServerState); // TODO: Add validation?
    eventSource.onerror = (): void =>
      setError("Lost connection to the server!");
    return () => eventSource.close();
  }, [applySSEPayload]);

  return <></>;
}

// Hook:
export function useApi(): ApiState {
  const context = useContext(ApiStateContext);
  if (!context)
    throw new Error(
      "useApi can only be used within the ApiStateProvider! Context was not present.",
    );
  return context;
}
