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
import type { SystemBundle } from "../../../src/system/model";

export interface UiPuppetState extends PuppetInfoBundle {
  setRuntime: (config: PuppetRuntimeConfigInput) => Promise<void>;
}

export interface UiWebServerState {
  puppets: Map<PuppetKey, UiPuppetState>;
  system?: SystemBundle;
}

interface ApiState {
  state: UiWebServerState;
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
  // TODO: Combine both helpers below into one?
  const [puppets, setPuppets] = useState<Map<string, UiPuppetState>>(new Map()); // TODO: Should puppets be in some sort of map? Should it contain a callback to modify that same puppet?
  const [system, setSystem] = useState<SystemBundle>();
  //TODO Check if loading and error are desired in this form.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyUiWebServerState = useCallback((state: UiWebServerState) => {
    setPuppets(state.puppets);
    setSystem(state.system);

    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    const eventSource = new EventSource("/api/state");

    eventSource.onmessage = (payload: MessageEvent<string>): void => {
      const data = JSON.parse(payload.data) as WebServerState;

      const puppets = new Map<PuppetKey, UiPuppetState>();

      for (const pup of data.puppets) {
        const key: PuppetKey = pup.config.specific.id;
        const full: UiPuppetState = {
          ...pup,
          setRuntime: async (config: PuppetRuntimeConfigInput): Promise<void> =>
            puppetSetRuntime(key, config),
        };
        puppets.set(key, full);
      }

      const state: UiWebServerState = {
        puppets: puppets,
        system: data.system,
      };

      applyUiWebServerState(state); // TODO: Add validation?
    };

    eventSource.onerror = (): void =>
      setError("Lost connection to the server!");

    return () => eventSource.close();
  }, [applyUiWebServerState]);

  const puppetSetRuntime = async (
    id: PuppetKey,
    runtime: PuppetRuntimeConfigInput,
  ): Promise<void> => {};
  const systemSetConfig = async (config: SystemConfig): Promise<void> => {};

  return (
    <ApiStateContext
      value={{
        state: {
          puppets: puppets,
          system: system,
        },
        callBacks: {
          puppet: {
            setRuntime: puppetSetRuntime,
          },
          system: {
            setConfig: systemSetConfig,
          },
        },
      }}
    >
      {children}
    </ApiStateContext>
  );
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
