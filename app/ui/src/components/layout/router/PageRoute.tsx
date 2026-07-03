import { type ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { type BackConfig, type PageMetaInput, usePageContext } from "../../../context/PageContext";

// TODO: Move somewhere else, does not belong in layout

// Links that want this page to show a back link back to themselves can
// navigate with state={{ back: {...} }} (or back: false to force-hide it).
interface PageRouteLocationState {
  back?: BackConfig | false;
}

export const PageRoute = ({ children, title, description, back }: PageMetaInput & { children: ReactNode }): ReactNode => {
  const { setMeta } = usePageContext();
  const location = useLocation();
  const backOverride = (location.state as PageRouteLocationState | null)?.back;

  useEffect(() => {
    setMeta({ title, description, back: backOverride ?? back });
  }, [title, description, backOverride, setMeta]);

  return children;
};
