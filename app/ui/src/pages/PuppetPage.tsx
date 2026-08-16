import { useParams, Link } from "react-router-dom";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { type JSX, useEffect } from "react";
import { PuppetHeader } from "../components/puppets/PuppetHeader";
import { DetailList, type DetailRow } from "../components/detailList/DetailList";
import { ViewTypeChip } from "../components/views/ViewTypeChip";
import { Icon } from "../components/icons/Icon";
import { Icons } from "../components/icons/Icons";
import { NavigationState } from "../../../src/puppet/types/model";
import { NavigationPill } from "../components/puppets/NavigationPill";
import { timeAgo } from "../common/helpers/relativeTime";
import { useNow } from "../common/hooks/useNow";
import "./puppetPage.less";

export default function PuppetPage(): JSX.Element {
  const { puppetKey } = useParams();
  const { state } = useApi();
  const { setMeta } = usePageContext();

  // Above the early return, since hooks must run in the same order every render.
  const now = useNow();

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
  ];

  const assignedRows: DetailRow[] = [
    {
      label: "View",
      value: assignedView ? (
        <Link className="assignedViewRow" to={`/views/${assignedView.key}`} state={{ back: { path: `/puppets/${puppet.config.id}`, label: puppet.config.name.long } }}>
          <span className="assignedViewIcon" style={{ background: assignedView.appearance.color }}>
            <Icon id={assignedView.appearance.icon} size={12} />
          </span>
          {assignedView.config.name.long}
          <Icons.chevronRight size={14} className="assignedViewChevron" />
        </Link>
      ) : "-",
    },
  ];
  if (assignedView) assignedRows.push({ label: "Type", value: <ViewTypeChip type={assignedView.config.type} /> });

  const targetInfo = puppet.info.target_info;
  const navigation = puppet.info.navigation;
  // The request exists on every navigation state except IDLE (never navigated).
  const request = navigation.state !== NavigationState.IDLE ? navigation.request : undefined;
  const pageRows: DetailRow[] = [
    {
      // What the display is actually doing, which the connection pill in the header cannot say:
      // an Online browser showing a DNS error is Online and broken at the same time.
      label: "Status",
      value: <NavigationPill navigation={navigation} />,
    },
    // Ticks on its own (useNow): the state broadcast only arrives when something changes, so a
    // puppet sitting in the same state all morning would freeze at "4 seconds ago".
    { label: "Last change", value: navigation.state === NavigationState.IDLE ? "-" : timeAgo(navigation.moment, now) },
  ];
  // Raw, as the browser said it: the net:: codes are searchable and stay correct as Chromium
  // adds to them, where a hand-kept translation table would quietly go stale.
  if (navigation.state === NavigationState.FAILED)
    pageRows.push({ label: "Error", value: navigation.error, copy: navigation.error });
  pageRows.push(
    { label: "Title", value: targetInfo?.title ?? "-" },
    // Always shown, beside the title it belongs to: a page without one is worth knowing about
    // (it usually means the page is not what you think it is), and a row that comes and goes
    // makes the section jump around as puppets navigate.
    { label: "Description", value: targetInfo?.description ?? "-" },
    { label: "URL", value: targetInfo?.url ?? "-", copy: targetInfo?.url },
    // Resolved from the shown view's config on navigation (0 disables it).
    { label: "Load timeout", value: request ? (request.load_timeout === 0 ? "Disabled" : `${request.load_timeout} ms`) : "-" },
  );
  if (targetInfo?.screenshot)
    pageRows.push({
      label: "Screenshot",
      value: <img src={targetInfo.screenshot} alt="Page screenshot" className="pageScreenshot" />,
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
