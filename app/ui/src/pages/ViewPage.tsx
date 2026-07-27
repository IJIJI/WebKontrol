import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { type JSX, useEffect, useState } from "react";
import { ViewHeader } from "../components/views/ViewHeader";

export default function ViewPage(): JSX.Element {
  const { viewKey } = useParams();
  const { state } = useApi();
  const { setMeta } = usePageContext();

  const [title, setTitle] = useState<string>(viewKey ?? "Unkown View");
  const view = viewKey ? state?.views.get(viewKey) : undefined;
  
  useEffect(() => {
    setTitle(view?.config.name.long ?? viewKey ?? "Unkown View");
  }, [view])

  useEffect(() => {
    setMeta({ title: ["overview", { label: "views", path: "/views" }, title] }, true);
  }, [viewKey, setMeta, title]);

  return (
    <>
      {view ? <ViewHeader view={view} /> : <h1>{title}</h1>}
      {/* TODO: sections below the header (assignments, config, health, usage, details). */}
      <pre>{JSON.stringify(view?.config, null, 2)}</pre>
    </>
  );
}
