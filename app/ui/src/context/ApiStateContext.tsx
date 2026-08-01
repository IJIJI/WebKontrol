import {
  type JSX,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import toast, { Toaster } from "react-hot-toast";
import type { WebServerState } from "../../../src/webServer/model";
import { Api } from "./Api";
import useConnectionToast from "../components/toast/useConnectionToast";
import { ConnectionStatus } from "./types";
import { type PuppetKey, type PuppetRuntime, type PuppetRuntimeInput } from "../../../src/puppet/types/schema";
import { type SystemRuntimeInput } from "../../../src/system/schema";
import { type UiRuntimeInput, type UiTheme } from "../../../src/ui/schema";
import { type PuppetDataBundle } from "../../../src/puppet/types/model";
import { ViewManagerRuntimeInput, type AnyViewConfig, type ViewKey } from "../../../src/views/types/schema";
import { PuppetOrchestratorRuntime, PuppetOrchestratorRuntimeInput } from "../../../src/orchestration/puppet/schema";

export interface UiPuppetState extends PuppetDataBundle {
  updateRuntime: (runtime: Partial<PuppetRuntime>) => Promise<void>; // TODO: Remove?
  assignView: (view: ViewKey) => Promise<void>;
  unassignView: () => Promise<void>;
}

// A view enriched with mutations bound to its key (like UiPuppetState). The wire ships a
// Record; the UI holds a Map so each value can carry update/delete.
export interface UiViewState {
  key: ViewKey;
  config: AnyViewConfig;
  update: (config: AnyViewConfig) => Promise<void>;
  delete: () => Promise<void>;
  assign: (puppets: PuppetKey[]) => Promise<void>;
}

export interface UiWebServerState extends Omit<WebServerState, "puppets" | "views"> {
  puppets: Map<PuppetKey, UiPuppetState>;
  views: Map<ViewKey, UiViewState>;
}

interface ApiState {
  state: UiWebServerState | null;
  status: ConnectionStatus;
  error: string | null;
  callBacks: { // TODO: Load directly from WebServerMutationHandlers?
    system: {
      updateRuntime: ( // TODO: Base update/api call template with the notify? Or base runtime update with generic runtime?
        config: Partial<SystemRuntimeInput>,
        notify?: boolean,
      ) => Promise<void>;
    };
    // update: {
    //   check: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
    //   apply: (ref: string, type: "release" | "branch") => Promise<void>; // TODO: Check arguments
    //   getStatus: () => Promise<void>; // (return type was UpdateStatus) // TODO: Split update status into current and available or smt
    // };
    ui: {
      updateRuntime: (
        config: Partial<UiRuntimeInput>,
        notify?: boolean,
      ) => Promise<void>;
    };
    puppet: {
      updateOrchestratorRuntime: (
        runtime: Partial<PuppetOrchestratorRuntime>,
        notify?: boolean,
      ) => Promise<void>;
      updateRuntime: (
        id: PuppetKey,
        runtime: Partial<PuppetRuntimeInput>,
        notify?: boolean,
      ) => Promise<void>;
      assignView: (
        puppet: PuppetKey,
        view: ViewKey,
        notify?: boolean,
      ) => Promise<void>;
      unassignView: (
        puppet: PuppetKey,
        notify?: boolean,
      ) => Promise<void>;
    };
    view: {
      create: (config: AnyViewConfig, notify?: boolean) => Promise<ViewKey>;
      update: (key: ViewKey, config: AnyViewConfig, notify?: boolean) => Promise<void>;
      delete: (key: ViewKey, notify?: boolean) => Promise<void>;
      updateRuntime: (
        config: Partial<ViewManagerRuntimeInput>,
        notify?: boolean,
      ) => Promise<void>;
    };
  };
}

const ApiStateContext = createContext<ApiState | null>(null);

// Wraps a mutation in a toast unless the caller opts out (e.g. to batch several
// calls under one toast of its own).
function withToast<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string },
  notify = true,
): Promise<T> {
  if (!notify) return promise;
  return toast.promise(promise, {
    ...messages,
    error: (e: unknown) => (e instanceof Error ? e.message : "Something went wrong"),
  });
}

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
    applyUiTheme(state.runtime.ui.theme);

    console.debug(
      `Updated state. Puppets:`,
      state.puppets,
      `Info:`,
      state.info,
      `Runtime:`,
      state.runtime
    );
  }, []);

  const applyUiTheme = useCallback((theme: UiTheme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ui-theme', theme);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/state");

    eventSource.addEventListener("open", (): void => {
      console.log("SSE connection to /api/state opened, awaiting initial state...");
    });

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
          const key: PuppetKey = pup.config.id;
          const full: UiPuppetState = {
            ...pup,
            updateRuntime: async (runtime: Partial<PuppetRuntime>): Promise<void> => puppetUpdateRuntime(key, runtime),
            assignView: async (view: ViewKey): Promise<void> => puppetAssignView(key, view),
            unassignView: async (): Promise<void> => puppetUnassignView(key),
          };
          puppets.set(key, full);
        }

        const views = new Map<ViewKey, UiViewState>();
        for (const [key, config] of Object.entries(data.views)) {
          const full: UiViewState = {
            key,
            config,
            update: (next: AnyViewConfig): Promise<void> => viewUpdate(key, next),
            delete: (): Promise<void> => viewDelete(key),
            assign: (puppets: PuppetKey[]): Promise<void> =>
              withToast(
                // Fire in parallel so the displays switch together, but await + toast as one op.
                Promise.all(puppets.map((puppet) => puppetAssignView(puppet, key, false))).then(() => undefined),
                { loading: "Assigning view…", success: "View assigned" },
              ),
          }
          views.set(key, full);
        }

        const state: UiWebServerState = {
          ...data,
          puppets: puppets,
          views: views,
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
    runtime: Partial<PuppetRuntimeInput>,
    notify = true,
  ): Promise<void> => {
    return withToast(
      Api.patch(`/puppets/${id}`, runtime),
      { loading: "Updating puppet…", success: "Puppet updated" },
      notify,
    );
  };

  const puppetAssignView = async (
    puppet: PuppetKey,
    view: ViewKey,
    notify = true,
  ): Promise<void> => {
    return withToast(
      Api.post(`/puppets/${puppet}/assign`, { view }),
      { loading: "Assigning view...", success: "View assigned" },
      notify,
    );
  };

  const puppetUnassignView = async (
    puppet: PuppetKey,
    notify = true,
  ): Promise<void> => {
    return withToast(
      Api.delete(`/puppets/${puppet}/unassign`),
      { loading: "Unassigning view...", success: "View cleared" },
      notify,
    );
  };

  const systemUpdateRuntime = async (
    config: Partial<SystemRuntimeInput>,
    notify = false,
  ): Promise<void> => {
    return withToast(
      Api.patch(`/config/system`, config),
      { loading: "Saving system settings…", success: "Saved" },
      notify,
    );
  };

  const puppetOrchestratorUpdateRuntime = async (
    config: Partial<PuppetOrchestratorRuntimeInput>,
    notify = false,
  ): Promise<void> => {
    return withToast(
      Api.patch(`/config/puppet`, config),
      { loading: "Saving puppet settings…", success: "Saved" },
      notify,
    );
  };

  const uiUpdateRuntime = async (
    config: Partial<UiRuntimeInput>,
    notify = false,
  ): Promise<void> => {
    return withToast(
      Api.patch(`/config/ui`, config),
      { loading: "Saving ui settings…", success: "Saved" },
      notify,
    );
  };

  const viewManagerUpdateRuntime = async (
    config: Partial<ViewManagerRuntimeInput>,
    notify = false,
  ): Promise<void> => {
    return withToast(
      Api.patch(`/config/view`, config),
      { loading: "Saving view settings…", success: "Saved" },
      notify,
    );
  };

  const viewCreate = async (
    config: AnyViewConfig,
    notify = true,
  ): Promise<ViewKey> => {
    const { key } = await withToast(
      Api.post<{ key: ViewKey }>("/views", config),
      { loading: "Creating view…", success: "View created" },
      notify,
    );
    return key;
  };

  const viewUpdate = async (
    key: ViewKey,
    config: AnyViewConfig,
    notify = true,
  ): Promise<void> => {
    return withToast(
      Api.patch(`/views/${key}`, config),
      { loading: "Saving view…", success: "View saved" },
      notify,
    );
  };

  const viewDelete = async (key: ViewKey, notify = true): Promise<void> => {
    return withToast(
      Api.delete(`/views/${key}`),
      { loading: "Deleting view…", success: "View deleted" },
      notify,
    );
  };

  useConnectionToast({ state: status });

  return (
    <ApiStateContext
      value={{
        state: state,
        status,
        error,
        callBacks: {
          system: {
            updateRuntime: systemUpdateRuntime,
          },
          ui: {
            updateRuntime: uiUpdateRuntime,
          },
          puppet: {
            updateOrchestratorRuntime: puppetOrchestratorUpdateRuntime,
            updateRuntime: puppetUpdateRuntime,
            assignView: puppetAssignView,
            unassignView: puppetUnassignView,
          },
          view: {
            create: viewCreate,
            update: viewUpdate,
            delete: viewDelete,
            updateRuntime: viewManagerUpdateRuntime,
          },
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
