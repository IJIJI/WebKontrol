import {
  type JSX,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Toaster } from "react-hot-toast";
import type { WebServerState } from "../../../src/webServer/model";
import type {
  PuppetKey,
  PuppetRuntimeConfigInput,
} from "../../../src/puppet/schema";
import type { SystemConfig } from "../../../src/system/schema";
import type { PuppetInfoBundle } from "../../../src/puppet/model";
import type { SystemBundle } from "../../../src/system/model";
import { Api } from "./Api";

export interface UiPuppetState extends PuppetInfoBundle {
  setRuntime: (config: PuppetRuntimeConfigInput) => Promise<void>;
}

export interface UiWebServerState {
  puppets: Map<PuppetKey, UiPuppetState>;
  system?: Partial<SystemBundle>;
}

export enum ConnectionStatus {
  CONNECTING = "Connecting",
  CONNECTED = "Connected",
  DISCONNECTED = "Disconnected",
} // TODO: Add difference between timed out and a closed sse.

interface ApiState {
  state: UiWebServerState; // TODO: Not nested?
  status: ConnectionStatus;
  error: string | null;
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

// TODO: Add toasts!
// const addProducer = async (type: string, config: ProducerConfig & Record<string, unknown>) => {
//   await toast.promise(
//     api.addProducer(type, config),
//     {
//       loading: 'Adding connection…',
//       success: 'Connection added',
//       error:   (e: unknown) => e instanceof Error ? e.message : 'Failed to add connection',
//     }
//   )
// }


export function ApiStateProvider({
  children,
  pingTimeoutMs = 7_500,
}: {
  children: JSX.Element;
  pingTimeoutMs?: number;
}): JSX.Element {
  const [puppets, setPuppets] = useState<Map<string, UiPuppetState>>(new Map());
  const [system, setSystem] = useState<Partial<SystemBundle> | undefined>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(ConnectionStatus.CONNECTING);

  const pingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyUiWebServerState = useCallback((state: UiWebServerState) => {
    setPuppets(state.puppets);
    setSystem(state.system);

    setError(null);

    console.debug(`Updated state. Puppets:`, state.puppets, `System:`, state.system);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/state");

    const resetPingTimeout = (): void => {
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = setTimeout(() => {
        setStatus(ConnectionStatus.DISCONNECTED);
        setError("Lost connection to the server (ping timeout)!");
      }, pingTimeoutMs);
    };

    eventSource.addEventListener("ping", (_payload: MessageEvent<string>): void => {
      resetPingTimeout();
    });

    eventSource.addEventListener("data", (payload: MessageEvent<string>): void => {
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

      setStatus(ConnectionStatus.CONNECTED);
      resetPingTimeout();
      applyUiWebServerState(state); // TODO: Add validation?
    });

    eventSource.onerror = (): void => {
      setStatus(ConnectionStatus.DISCONNECTED);
      setError("Lost connection to the server!");
    };

    return () => {
      eventSource.close();
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
    };
  }, [applyUiWebServerState, pingTimeoutMs]);

  useEffect(() => {
    switch(status) {
      case ConnectionStatus.CONNECTED:
        console.log(`Connected to server!`);
        break;
      case ConnectionStatus.DISCONNECTED:
        console.warn(`Lost connection to server!`);
        break;
      case ConnectionStatus.CONNECTING:
      default:
        console.debug(`Connection state is now ${status}`);
    }
  }, [status])

  const puppetSetRuntime = async (
    id: PuppetKey,
    runtime: PuppetRuntimeConfigInput,
  ): Promise<void> => {
    return Api.patch(`/api/puppets/${id}`, runtime);
  };

  const systemSetConfig = async (config: SystemConfig): Promise<void> => {
    return Api.patch(`/api/system/config`, config);
  };

  return (
    <ApiStateContext
      value={{
        state: {
          // TODO: Not nested for easier access?
          puppets: puppets,
          system: system,
        },
        status,
        error,
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
      <Toaster // TODO: Here or in the app.ts? Or in the layout? In the router?
        position="top-right"
        containerStyle={{ top: 70, right: 14 }} // TODO: tweak
        toastOptions={{
            style: {
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                fontSize: 13,
            },
            error: { duration: 5000 },
        }}
      />
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
