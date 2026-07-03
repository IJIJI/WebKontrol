import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { WithRequiredExept, type WithRequired } from "../../../src/types/CommonTypes";

export type BackConfig = false | {
  path: string;
  label?: string;
};

export type titleSegment = string | {label: string, path: string};
export type MetaTitle = titleSegment[];
export type MetaTitleInput = string | MetaTitle;

const normalizeMetaTitle = (t: MetaTitleInput): MetaTitle =>
  typeof t === "string" ? [ t ] : t;

const serializeMetaTitle = (title: MetaTitle): string => {
  return title.join(" > ");
}

export interface PageMeta { // TODO: Add more like og
  title?: MetaTitle;
  description?: string;
  back?: BackConfig;
}

export interface PageMetaInput extends Omit<PageMeta, "title">{
  title?: MetaTitleInput
}

type RequiredPageMeta = WithRequiredExept<PageMeta, "back">;
// type RequiredPageMetaInput = WithRequired<PageMeta, "description">;

// TODO: Add a way to change the base for named instances
const DEFAULT_PAGE_META: RequiredPageMeta = {
  title: ["WebKontrol"],
  description: "WebKontrol remote browser - An intuitive web kiosk with a web-based admin panel.",
}

interface PageState extends RequiredPageMeta {
  setMeta: (meta: PageMetaInput, keepPrevious?: boolean) => void;
}

const PageStateContext = createContext<PageState | null>(null);

export function PageStateProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {

  const [meta, setMetaState] = useState<RequiredPageMeta>(DEFAULT_PAGE_META);

  const setMeta = useCallback((next: PageMetaInput, keepPrevious?: boolean) => {
    setMetaState((prev) => {
      const base = keepPrevious ? prev : DEFAULT_PAGE_META
      return {
        title: next.title !== undefined ? normalizeMetaTitle(next.title) : base.title,
        description: next.description !== undefined ? next.description : base.description,
        back: next.back !== undefined ? next.back : base.back,
      };
    });
  }, []);

  useEffect(() => {
    document.title = meta.title
      ? `${serializeMetaTitle(meta.title)} - ${serializeMetaTitle(DEFAULT_PAGE_META.title)}`
      : serializeMetaTitle(DEFAULT_PAGE_META.title);
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
        // title: meta.title ?? {primary: DEFAULT_PAGE_META.title},
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
