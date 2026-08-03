import { useParams, Link } from "react-router-dom";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { type JSX, useEffect } from "react";
import { PuppetHeader } from "../components/puppets/PuppetHeader";
import { DetailList, type DetailRow } from "../components/detailList/DetailList";
import { ViewTypeChip } from "../components/views/ViewTypeChip";
import "./puppetPage.less";

export default function PuppetPage(): JSX.Element {
  const { puppetKey } = useParams();
  const { state } = useApi();
  const { setMeta } = usePageContext();

  const puppet = puppetKey ? state?.puppets.get(puppetKey) : undefined;
  const title = puppet?.config.name.long ?? puppetKey ?? "Unknown Puppet";

  useEffect(() => {
    setMeta({ title: ["overview", { label: "Puppets", path: "/puppets" }, title] }, true);
  }, [setMeta, title]);

  if (!puppet) return <h1>{title}</h1>;

  const assignedView = puppet.assignedView ? state?.views.get(puppet.assignedView) : undefined;

  const detailRows: DetailRow[] = [
    { label: "ID", value: puppet.config.id, copy: puppet.config.id },
    { label: "Name", value: puppet.config.name.long },
    { label: "Short name", value: puppet.config.name.short },
    { label: "Load timeout", value: `${puppet.runtime.load_timout} ms` },
  ];

  const assignedRows: DetailRow[] = [
    {
      label: "View",
      value: assignedView ? (
        <>
          <Link to={`/views/${assignedView.key}`}>{assignedView.config.name.long}</Link>{" "}
          <ViewTypeChip type={assignedView.config.type} />
        </>
      ) : (
        "-"
      ),
    },
  ];

  const { target_info } = puppet.info;
  const pageRows: DetailRow[] = [
    { label: "Title", value: target_info?.title ?? "-" },
    { label: "URL", value: target_info?.url ?? "-", copy: target_info?.url },
  ];
  if (target_info?.description) pageRows.push({ label: "Description", value: target_info.description });
  if (target_info?.screenshot)
    pageRows.push({
      label: "Screenshot",
      value: <img src={target_info.screenshot} alt="Page screenshot" className="pageScreenshot" />,
    });

  return (
    <>
      <PuppetHeader puppet={puppet} />
      <div className="pageSections">
        <DetailList title="Details" rows={detailRows} />
        <DetailList title="Assigned view" rows={assignedRows} />
        <DetailList title="Current page" rows={pageRows} />
      </div>
    </>
  );
}
