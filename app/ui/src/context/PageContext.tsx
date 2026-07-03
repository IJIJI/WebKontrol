import { createContext, type JSX, useContext, useEffect, useState } from "react";

interface PageState { // TODO: Add more like og
  title?: string;
  setTitle: (value?: string) => void;
  description?: string;
  setDescription: (value?: string) => void;
}

const PageStateContext = createContext<PageState | null>(null);

// TODO: Reset title and description on page load, check if a context is the best way to do this.
export function PageStateProvider({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {

  const [title, setTitle] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>("WebKontrol remote browser - An intuitive web kiosk with a web-based admin panel.")

  useEffect(() => {
    document.title = title ? title + " - WebKontrol" : "WebKontrol";
  }, [title]);

  return (
    <PageStateContext
      value={{
        title, setTitle,
        description, setDescription
      }}
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
