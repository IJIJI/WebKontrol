import { AppErrorBoundary } from "./boundaries/AppErrorBoundary";
import { ApiStateProvider } from "./context/ApiStateContext";

export default function App() {
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