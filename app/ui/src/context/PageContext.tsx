import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { type WithRequired } from "../../../src/types/CommonTypes";

export interface BackConfig {
  path: string;
  label?: string;
};

export interface PageMeta { // TODO: Add more like og
  title?: string;
  description?: string;
  back?: BackConfig | false;
}

type RequiredPageMeta = Required<PageMeta>;
type RequiredPageMetaInput = WithRequired<PageMeta, "description">;


const DEFAULT_PAGE_META: RequiredPageMeta = {
  title: "WebKontrol",
  description: "WebKontrol remote browser - An intuitive web kiosk with a web-based admin panel.",
  back: false,
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

  const [meta, setMetaState] = useState<RequiredPageMeta>(DEFAULT_PAGE_META);

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
        // title: meta.title ?? FALLBACK_PAGE_META.title,
        title: meta.title ?? "",

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
