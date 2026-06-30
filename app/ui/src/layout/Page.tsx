import { JSX, useEffect } from "react";


export type MetaData = {
  title: string,
  description: string,
}

export const DEFAULT_METADATA: MetaData = {
  title: "WebKontrol",
  description: "WebKontrol remote browser - An intuitive web kiosk with a web-based admin panel."
}

const withDefaultMeta = (meta?: Partial<MetaData>): MetaData => {
  const combined = {
    ...DEFAULT_METADATA,
    ...meta,
  }
  if (meta?.title) {
    combined.title = meta.title + " - WebKontrol";
  }
  return combined;
}

export const Page = ({children, meta}: {children: JSX.Element, meta?: MetaData}) => {
  
  useEffect(() => {
    const parsed = withDefaultMeta(meta);

    document.title = parsed.title;
  }, [meta]);
  return children;
};
