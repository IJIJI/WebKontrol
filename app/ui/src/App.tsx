import type { JSX } from "react";
import { AppErrorBoundary } from "./boundaries/AppErrorBoundary";
import { ApiStateProvider } from "./context/ApiStateContext";
import PageLayout from "./components/layout/PageLayout";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import OverviewPage from "./pages/OverviewPage";
import DashboardPage from "./pages/DashboardPage";
import ViewsPage from "./pages/ViewsPage";
import SettingsPage from "./pages/SettingsPage";
import PluginsPage from "./pages/PluginsPage";

export default function App(): JSX.Element {
  return (
    //TODO: Check if this is the right split. Different error boundary for the views?
    // TODO: error boundary inside or outside of router? What about state providers?
    <AppErrorBoundary>
    <ApiStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PageLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="views" element={<ViewsPage />} />
            
            <Route path="settings/plugins" element={<PluginsPage />} />
            <Route path="settings/config" element={<SettingsPage />} />

            <Route path="*"  element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      {/* <h1>HI</h1> */}
      {/* <BrandLogo version="V1.0.0" /> */}
    </ApiStateProvider>
    </AppErrorBoundary>
  );
}
