import type { JSX } from "react";
import { AppErrorBoundary } from "./boundaries/AppErrorBoundary";
import { ApiStateProvider } from "./context/ApiStateContext";
import { BrandLogo } from "./components/branding/BrandLogo"

export default function App(): JSX.Element {
  return (
    //TODO: Check if this is the right split. Different error boundary for the views?
    // TODO: error boundary inside or outside of router? What about state providers?
    <>
      <AppErrorBoundary>
        <ApiStateProvider>
          {/* <h1>HI</h1> */}
          <BrandLogo version="V1.0.0" />
        </ApiStateProvider>
      </AppErrorBoundary>
      {/* <AppErrorBoundary>
        <ViewStateProvider>
          <h1>Screen!</h1>
        </ViewStateProvider>
      </AppErrorBoundary> */}
    </>
  );
}
