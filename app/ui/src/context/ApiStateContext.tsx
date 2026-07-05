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
import type { PuppetInfoBundle } from "../../../src/puppet/model";
import { Api } from "./Api";
import useConnectionToast from "../components/toast/useConnectionToast";
import { ConnectionStatus } from "./types";
import { CoreRuntimeConfigInput } from "../../../src/core/schema";
import { UiRuntimeConfigInput } from "../../../src/types/UiTypes";

export interface UiPuppetState extends PuppetInfoBundle {
  setRuntime: (config: PuppetRuntimeConfigInput) => Promise<void>;
}



export interface UiWebServerState extends Omit<WebServerState, "puppets"> {
  puppets: Map<PuppetKey, UiPuppetState>;
}

interface ApiState {
  state: UiWebServerState | null;
  status: ConnectionStatus;
  error: string | null;
  callBacks: { // TODO: Load directly from WebServerMutationHandlers?
    puppet: {
      updateRuntime: (
        id: PuppetKey,
        runtime: Partial<PuppetRuntimeConfigInput>,
      ) => Promise<void>;
    };
    core: {
      updateConfig: (config: Partial<CoreRuntimeConfigInput>) => Promise<void>;
    };
    ui: {
      updateConfig: (config: Partial<UiRuntimeConfigInput>) => Promise<void>;
    }
    // update: {
    //   check: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
    //   apply: (ref: string, type: "release" | "branch") => Promise<void>; // TODO: Check arguments
    //   getStatus: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
    // };
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
  const [state, setState] = useState<UiWebServerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(ConnectionStatus.CONNECTING);

  const pingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyUiWebServerState = useCallback((state: UiWebServerState) => {
    setState(state);

    setError(null);

    console.debug(
      `Updated state. Puppets:`,
      state.puppets,
      `Info:`,
      state.info,
      `Config:`,
      state.config
    );
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

    eventSource.addEventListener(
      "ping",
      (_payload: MessageEvent<string>): void => {
        resetPingTimeout();
      },
    );

    eventSource.addEventListener(
      "data",
      (payload: MessageEvent<string>): void => {
        const data = JSON.parse(payload.data) as WebServerState;

        const puppets = new Map<PuppetKey, UiPuppetState>();

        for (const pup of data.puppets) {
          const key: PuppetKey = pup.config.specific.id;
          const full: UiPuppetState = {
            ...pup,
            setRuntime: async (
              config: PuppetRuntimeConfigInput,
            ): Promise<void> => puppetUpdateRuntime(key, config),
          };
          puppets.set(key, full);
        }

        const state: UiWebServerState = {
          ...data,
          puppets: puppets,
        };

        setStatus(ConnectionStatus.CONNECTED);
        resetPingTimeout();
        applyUiWebServerState(state); // TODO: Add validation?
      },
    );

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
    switch (status) {
      case ConnectionStatus.CONNECTED:
        console.log(`Connected to server!`);
        break;
      case ConnectionStatus.DISCONNECTED:
        console.warn(`Lost connection to server!`); // TODO: Add auto reconnect.
        break;
      case ConnectionStatus.CONNECTING:
      default:
        console.debug(`Connection state is now ${status}`);
    }
  }, [status]);

  const puppetUpdateRuntime = async (
    id: PuppetKey,
    runtime: Partial<PuppetRuntimeConfigInput>,
  ): Promise<void> => {
    return Api.patch(`/puppets/${id}`, runtime);
  };

  const coreUpdateRuntimeConfig = async (config: Partial<CoreRuntimeConfigInput>): Promise<void> => {
    return Api.patch(`/config/core`, config);
  };

  const uiUpdateRuntimeConfig = async (config: Partial<UiRuntimeConfigInput>): Promise<void> => {
    return Api.patch(`/config/ui`, config)
  }

  useConnectionToast({ state: status });

  return (
    <ApiStateContext
      value={{
        state: state,
        status,
        error,
        callBacks: {
          puppet: {
            updateRuntime: puppetUpdateRuntime,
          },
          core: {
            updateConfig: coreUpdateRuntimeConfig,
          },
          ui: {
            updateConfig: uiUpdateRuntimeConfig,
          }
        },
      }}
    >
      <Toaster // TODO: Here or in the app.ts? Or in the layout? In the router?
        position="top-right"
        containerStyle={{ top: 25, right: 20 }} // TODO: tweak
        toastOptions={{
          style: {
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            border: "0.5px solid var(--color-border-secondary)",
            fontSize: 16,
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
