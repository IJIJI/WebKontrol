import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { type JSX, useEffect, useState } from "react";
import { ViewHeader } from "../components/views/ViewHeader";
import { ViewDetails } from "../components/views/ViewDetails";
import "./viewPage.less";

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
      {view ? (
        <>
          <ViewHeader view={view} />
          <div className="pageSections">
            <ViewDetails view={view} />
          </div>
        </>
      ) : (
        <h1>{title}</h1>
      )}
      {/* TODO: more sections (assignments, config summary, health, usage). */}
      <pre>{JSON.stringify(view?.config, null, 2)}</pre>
    </>
  );
}
