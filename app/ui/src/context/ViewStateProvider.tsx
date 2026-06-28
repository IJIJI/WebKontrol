import { createContext, JSX, useContext } from "react";

interface ViewState {
  url: string;
}

const ViewStateContext = createContext<ViewState | null>(null);

export function ViewStateProvider({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  return (
    <ViewStateContext
      value={{
        url: "https://example.com/",
      }}
    >
      {children}
    </ViewStateContext>
  );
}

// Hook:
export function useScreen(): ViewState {
  const context = useContext(ViewStateContext);
  if (!context)
    throw new Error(
      "useApi can only be used within the ApiStateProvider! Context was not present.",
    );
  return context;
}
