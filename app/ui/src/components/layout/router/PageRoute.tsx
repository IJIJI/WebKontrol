import { type ReactNode, useEffect } from "react";
import { type PageMeta, usePageContext } from "../../../context/PageContext";

// TODO: Move somewhere else, does not belong in layout

export const PageRoute = ({ children, title, description, back }: PageMeta & { children: ReactNode }): ReactNode => {
  const { setMeta } = usePageContext();

  useEffect(() => {
    setMeta({ title, description, back });
  }, [title, description, setMeta]);

  return children;
};
