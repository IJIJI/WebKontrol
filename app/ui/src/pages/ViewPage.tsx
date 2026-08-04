import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { type JSX, useEffect } from "react";
import { ViewHeader } from "../components/views/ViewHeader";
import { ViewDetails } from "../components/views/ViewDetails";
import { ViewConfigSummary } from "../components/views/ViewConfigSummary";
import "./viewPage.less";

export default function ViewPage(): JSX.Element {
  const { viewKey } = useParams();
  const { state } = useApi();
  const { setMeta } = usePageContext();

  const view = viewKey ? state?.views.get(viewKey) : undefined;
  const title = view?.config.name.long ?? viewKey ?? "Unknown View";

  useEffect(() => {
    setMeta({ title: ["overview", { label: "views", path: "/views" }, title] }, true);
  }, [setMeta, title]);

  return (
    <>
      {view ? (
        <>
          <ViewHeader view={view} />
          <div className="pageSections">
            <ViewDetails view={view} />
            <ViewConfigSummary view={view} />
          </div>
        </>
      ) : (
        <h1>{title}</h1>
      )}
      {/* TODO: more sections (assignments, config summary, health, usage). */}
    </>
  );
}
