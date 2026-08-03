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
import { PageStateProvider } from "./context/PageContext";
import { PageRoute } from "./components/layout/router/PageRoute";
import PuppetPage from "./pages/PuppetPage";
import PuppetsPage from "./pages/PuppetsPage";
import EditPuppetPage from "./pages/EditPuppetPage";
import EditViewPage from "./pages/EditViewPage";
import ViewPage from "./pages/ViewPage";
import TestPage from "./pages/TestPage";

export default function App(): JSX.Element {
  return (
    //TODO: Check if this is the right split. Different error boundary for the views?
    // TODO: error boundary inside or outside of router? What about state providers?
    <AppErrorBoundary>
      <ApiStateProvider>
        <PageStateProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PageLayout />}>
                <Route
                  index
                  element={
                    <PageRoute>
                      <OverviewPage />
                    </PageRoute>
                  }
                />
                <Route
                  path="dashboard"
                  element={
                    <PageRoute title={["overview", "dashboard"]}>
                      <DashboardPage />
                    </PageRoute>
                  }
                />
                <Route
                  path="views"
                  element={
                    <PageRoute title={["overview", "views"]}>
                      <ViewsPage />
                    </PageRoute>
                  }
                />
                <Route
                  path="views/new"
                  element={
                    <PageRoute title={["overview", { label: "views", path: "/views" }, "new"]}>
                      <EditViewPage />
                    </PageRoute>
                  }
                />
                <Route
                  path="views/:viewKey"
                  element={
                    <PageRoute title={["overview", { label: "views", path: "/views" }, "view"]}>
                      <ViewPage />
                    </PageRoute>
                  }
                />
                <Route
                  path="views/:viewKey/edit"
                  element={
                    <PageRoute title={["overview", { label: "views", path: "/views" }, "edit"]}>
                      <EditViewPage />
                    </PageRoute>
                  }
                />

                <Route
                  path="puppets"
                  element={
                    <PageRoute title={["overview", "Puppets"]}>
                      <PuppetsPage />
                    </PageRoute>
                  }
                />
                <Route
                  path="puppets/:puppetKey"
                  element={
                    <PageRoute title="Puppet">
                      <PuppetPage />
                    </PageRoute>
                  }
                />
                <Route
                  path="puppets/:puppetKey/edit"
                  element={
                    <PageRoute title="Edit Puppet">
                      <EditPuppetPage />
                    </PageRoute>
                  }
                />

                <Route
                  path="settings/plugins"
                  element={
                    <PageRoute title={["Settings", "Plugins"]}>
                      <PluginsPage />
                    </PageRoute>
                  }
                />
                <Route
                  path="settings/config"
                  element={
                    <PageRoute
                      title={[
                        { label: "Settings", path: "/settings" },
                        "config",
                      ]}
                    >
                      <SettingsPage />
                    </PageRoute>
                  }
                />

                {import.meta.env.DEV && (
                  <Route path="test" element={<PageRoute title="Test"><TestPage /></PageRoute>} />
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          {/* <h1>HI</h1> */}
          {/* <BrandLogo version="V1.0.0" /> */}
        </PageStateProvider>
      </ApiStateProvider>
    </AppErrorBoundary>
  );
}
