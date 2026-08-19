import { type JSX } from "react";
import { useNavigate } from "react-router-dom";

import { UpdateState, type UpdateInfo } from "../../../../src/system/update/model";
import type { UpdateJournalEntry } from "../../../../src/system/update/schema";
import { timeAgo } from "../../common/helpers/relativeTime";
import { useNow } from "../../common/hooks/useNow";
import { useApi } from "../../context/ApiStateContext";
import { ButtonSetting } from "../settings/implementations/ButtonSetting";

/**
 * The Firmware row of the About section: which version this is, what the update system is
 * doing, and the way through to the releases. A dot on the button is the only thing that
 * announces itself; everything else waits until the operator goes looking.
 */

// What the row says under its title. One line, because the row is a summary: the page
// itself carries the release list, the notes and the journal in full.
function statusLine(info: UpdateInfo, now: number): string {
  if (!info.managed) return `${info.current} · managed by git`;
  if (info.journal?.status === "applying" && info.activity.state !== UpdateState.APPLYING)
    return `${info.current} · confirming the update`;

  switch (info.activity.state) {
    case UpdateState.CHECKING:
      return `${info.current} · checking for updates…`;
    case UpdateState.APPLYING:
      return `${info.current} · installing ${info.activity.target.version}…`;
    case UpdateState.READY:
      return `${info.current} · ${info.activity.latest.version} available`;
    case UpdateState.IDLE:
    case UpdateState.FAILED:
      return info.lastChecked === null
        ? `${info.current} · not checked yet`
        : `${info.current} · checked ${timeAgo(info.lastChecked, now)}`;
  }
}

/**
 * Only things that need attention. A bad outcome keeps reporting itself here until it is
 * acknowledged on the updates page, which is where an operator can actually act on it;
 * a live condition (a failing check) clears itself when the condition does.
 */
function problem(info: UpdateInfo, journal: UpdateJournalEntry | undefined, now: number): string | undefined {
  if (info.activity.state === UpdateState.FAILED) return `Update failed: ${info.activity.error}`;
  if (journal?.acknowledged !== true) {
    if (journal?.status === "rolled-back")
      return `${journal.to} crashed ${timeAgo(journal.moment, now)} and was rolled back to ${journal.from}`;
    if (journal?.status === "failed")
      return `Updating to ${journal.to} failed ${timeAgo(journal.moment, now)}`;
  }
  if (info.checkError !== undefined) return `Check failed: ${info.checkError}`;
  return undefined;
}

export function UpdateSettings(): JSX.Element | null {
  const api = useApi();
  const navigate = useNavigate();
  const info = api.state?.info.update;
  const now = useNow(30_000);

  if (!info) return null;

  return (
    <ButtonSetting
      title="Firmware"
      subtitle={statusLine(info, now)}
      error={problem(info, info.journal, now)}
      label={info.managed ? "Update" : "Releases"}
      badge={info.activity.state === UpdateState.READY}
      onClick={() => void navigate("/settings/updates")}
    />
  );
}
