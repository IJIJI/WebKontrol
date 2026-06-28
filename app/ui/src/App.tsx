import type { JSX } from "react";
import { AppErrorBoundary } from "./boundaries/AppErrorBoundary";
import { ApiStateProvider } from "./context/ApiStateContext";

export default function App(): JSX.Element {
  return (
    <AppErrorBoundary>
      <ApiStateProvider>
        <h1>
          HI
        </h1>
      </ApiStateProvider>
    </AppErrorBoundary>
  );
}