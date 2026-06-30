import type { JSX } from "react";
import { AppErrorBoundary } from "./boundaries/AppErrorBoundary";
import { ApiStateProvider } from "./context/ApiStateContext";
import PageLayout from "./components/layout/PageLayout";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export default function App(): JSX.Element {
  return (
    //TODO: Check if this is the right split. Different error boundary for the views?
    // TODO: error boundary inside or outside of router? What about state providers?
    <AppErrorBoundary>
    <ApiStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PageLayout />}>
            <Route index element={<h1>Test!</h1>} />
          </Route>
        </Routes>
      </BrowserRouter>
      {/* <h1>HI</h1> */}
      {/* <BrandLogo version="V1.0.0" /> */}
    </ApiStateProvider>
    </AppErrorBoundary>
  );
}
