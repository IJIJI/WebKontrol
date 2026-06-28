import type { JSX } from "react";
import { AppErrorBoundary } from "./boundaries/AppErrorBoundary";
import { ApiStateProvider } from "./context/ApiStateContext";
import { ViewStateProvider } from "./context/ViewStateProvider";

export default function App(): JSX.Element {
  return ( //TODO: Check if this is the right split. Different error boundary for the views?
    <>
      <AppErrorBoundary>
        <ApiStateProvider>
          <h1>HI</h1>
        </ApiStateProvider>
      </AppErrorBoundary>
      <AppErrorBoundary>
        <ViewStateProvider>
          <h1>Screen!</h1>
        </ViewStateProvider>
      </AppErrorBoundary>
    </>
  );
}
