import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { type WithRequired } from "../../../src/types/CommonTypes";

export interface PageMeta { // TODO: Add more like og
  title?: string;
  description?: string;
}

type RequiredPageMetaInput = WithRequired<PageMeta, "description">;
type RequiredPageMetaDefaults = Required<Omit<PageMeta, "description">>;

export const DEFAULT_PAGE_META: RequiredPageMetaInput = {
  description: "WebKontrol remote browser - An intuitive web kiosk with a web-based admin panel.",
}

const FALLBACK_PAGE_META: RequiredPageMetaDefaults = {
  title: "WebKontrol"
}

interface PageState extends Required<PageMeta> {
  setMeta: (meta: PageMeta, keepPrevious?: boolean) => void;
}

const PageStateContext = createContext<PageState | null>(null);

export function PageStateProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {

  const [meta, setMetaState] = useState<RequiredPageMetaInput>(DEFAULT_PAGE_META);

  const setMeta = useCallback((next: PageMeta, keepPrevious?: boolean) => {
    setMetaState((prev) => {
      const base = keepPrevious ? prev : DEFAULT_PAGE_META
      const merged = { ...base, ...next };
      return merged;
    });
  }, []);

  useEffect(() => {
    document.title = meta.title
      ? `${meta.title} - ${FALLBACK_PAGE_META.title}`
      : FALLBACK_PAGE_META.title;
  }, [meta.title]);

  useEffect(() => {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = meta.description;
  }, [meta.description]);

  return (
    <PageStateContext
      value={{
        ...meta,
        title: meta.title ?? FALLBACK_PAGE_META.title, // TODO: Should this exist?
        setMeta,
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
