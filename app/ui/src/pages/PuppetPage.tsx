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
import { BLANK_NAVIGATION_REQUEST } from "../../../src/puppet/types/schema";
import { NavigationPill } from "../components/puppets/NavigationPill";
import { StatusPill } from "../components/pill/statusPill/StatusPill";
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
  const url = targetInfo?.url === BLANK_NAVIGATION_REQUEST.target ? undefined : targetInfo?.url;
  const navigation = puppet.info.navigation;
  // The request exists on every navigation state except IDLE (never navigated).
  const request = navigation.state !== NavigationState.IDLE ? navigation.request : undefined;
  // Whether it loaded, and under what terms.
  const statusRows: DetailRow[] = [
    // Both axes, in the order they fail: the header's single pill derives from these two and
    // shows whichever is worse, so this is where the half it did not show stays readable.
    { label: "Browser", value: <StatusPill status={puppet.info.state} /> },
    {
      // What the display is actually doing, which the connection state cannot say on its own:
      // an Online browser showing a DNS error is Online and broken at the same time.
      label: "Page",
      value: <NavigationPill navigation={navigation} />,
    },
    // Ticks on its own (useNow): the state broadcast only arrives when something changes, so a
    // puppet sitting in the same state all morning would freeze at "4 seconds ago".
    { label: "Last change", value: navigation.state === NavigationState.IDLE ? "-" : timeAgo(navigation.moment, now) },
  ];
  // Raw, as the browser said it: the net:: codes are searchable and stay correct as Chromium
  // adds to them, where a hand-kept translation table would quietly go stale.
  if (navigation.state === NavigationState.FAILED)
    statusRows.push({ label: "Error", value: navigation.error, copy: navigation.error });
  // View-derived but navigation-applied: it belongs beside the load it governed rather than in
  // the assignment, which is empty whenever a puppet is showing the default view instead.
  // Resolved from the shown view's config on navigation (0 disables it).
  statusRows.push(
    { label: "Load timeout", value: request ? (request.load_timeout === 0 ? "Disabled" : `${request.load_timeout} ms`) : "-" },
  );

  // What is on screen, read from the live document.
  const pageRows: DetailRow[] = [
    { label: "Title", value: targetInfo?.title ?? "-" },
    // Always shown, beside the title it belongs to: a page without one is worth knowing about
    // (it usually means the page is not what you think it is), and a row that comes and goes
    // makes the section jump around as puppets navigate.
    { label: "Description", value: targetInfo?.description ?? "-" },
    // about:blank is never a page anyone navigated to: it is what an unassigned puppet sits on,
    // and what a failed one is parked on while the fallback page is written into it. Reporting
    // it as the current URL dresses an internal detail up as content.
    ...(url === undefined ? [{ label: "URL", value: "-" }] : [{ label: "URL", value: url, copy: url }]),
  ];
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
        <DetailList title="Status" rows={statusRows} />
        <DetailList title="Current page" rows={pageRows} />
      </div>
    </>
  );
}
