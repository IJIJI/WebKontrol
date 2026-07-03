import { createContext, type JSX, useContext, useEffect, useState } from "react";

interface PageState { // TODO: Add more like og
  title?: string;
  description?: string;
}

const PageStateContext = createContext<PageState | null>(null);

// TODO: Reset title and description on page load, check if a context is the best way to do this.
export function PageStateProvider({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {

  const [state, setState] = useState<PageState>({
    description: "WebKontrol remote browser - An intuitive web kiosk with a web-based admin panel."
  });

  useEffect(() => {
    document.title = state.title ? state.title + "- WebKontrol" : "WebKontrol";
  }, [state]);

  return (
    <PageStateContext
      value={state}
    >
      {children}
    </PageStateContext>
  );
}

// Hook:
export function usePageContext(): PageState {
  const context = useContext(PageStateContext);

  if (!context)
    throw new Error(
      "usePageContext can only be used within the PageStateProvider! Context was not present.",
    );
  return context;
}
