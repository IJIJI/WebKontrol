import { createContext, type JSX, useContext, useEffect, useState } from "react";

interface PageState {
  title?: string
}

const PageStateContext = createContext<PageState | null>(null);

export function PageStateProvider({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {

  const [state, setState] = useState<PageState>({});

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
