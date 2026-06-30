import { JSX, useEffect } from "react";

const Page = ({children, title}: {children: JSX.Element, title?: string}) => {
  useEffect(() => {
    document.title = title ? title + " - WebKontrol" : "WebKontrol";
  }, [title]);
  return children;
};

export default Page;