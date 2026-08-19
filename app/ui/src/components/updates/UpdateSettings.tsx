import { type JSX } from "react";
import { useNavigate } from "react-router-dom";

import { ConnectionState } from "../../../../src/types/CommonTypes";
import { UpdateState, type UpdateInfo } from "../../../../src/system/update/model";
import type { UpdateJournalEntry } from "../../../../src/system/update/schema";
import { timeAgo } from "../../common/helpers/relativeTime";
import { useNow } from "../../common/hooks/useNow";
import { useApi } from "../../context/ApiStateContext";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { BaseSetting } from "../settings/BaseSetting";
import { ButtonSetting } from "../settings/implementations/ButtonSetting";
import { SettingGroup } from "../settings/SettingGroup";

// ConnectionState is borrowed for its pill variant only, the NavigationPill precedent.
function describe(info: UpdateInfo): { status: ConnectionState; label: string } {
  if (!info.managed) return { status: ConnectionState.DISABLED, label: "Managed by git" };
  switch (info.activity.state) {
    case UpdateState.IDLE:
      return { status: ConnectionState.ONLINE, label: "Up to date" };
    case UpdateState.CHECKING:
      return { status: ConnectionState.UNKNOWN, label: "Checking…" };
    case UpdateState.READY:
      return { status: ConnectionState.UNKNOWN, label: `${info.activity.latest.version} available` };
    case UpdateState.APPLYING:
      return { status: ConnectionState.UNKNOWN, label: `Updating to ${info.activity.target.version}…` };
    case UpdateState.FAILED:
      return { status: ConnectionState.FAILED, label: "Update failed" };
  }
}

function journalText(journal: UpdateJournalEntry, now: number): string {
  const when = timeAgo(journal.moment, now);
  switch (journal.status) {
    case "applying":
      return `Updating ${journal.from} to ${journal.to}…`;
    case "ok":
      return `Updated ${journal.from} to ${journal.to} ${when}`;
    case "rolled-back":
      return `${journal.to} crashed ${when} and was rolled back to ${journal.from}`;
    case "failed":
      return `Updating to ${journal.to} failed ${when}: ${journal.error ?? "unknown error"}`;
  }
}

/**
 * The Updates section of Settings: whether this system is current, and the way through to
 * the update page, which owns the releases themselves. Everything here rides the SSE state.
 */
export function UpdateSettings(): JSX.Element | null {
  const api = useApi();
  const navigate = useNavigate();
  const info = api.state?.info.update;
  const now = useNow(30_000);

  if (!info) return null;

  const { status, label } = describe(info);
  const journalFailed = info.journal?.status === "failed" || info.journal?.status === "rolled-back";

  return (
    <SettingGroup title="Updates">
      <>
        <BaseSetting
          title="Status"
          subtitle={
            info.managed
              ? `Version ${info.current} · ${
                  info.lastChecked === null ? "not checked yet" : `checked ${timeAgo(info.lastChecked, now)}`
                }`
              : `Version ${info.current}`
          }
          error={info.checkError === undefined ? undefined : `Check failed: ${info.checkError}`}
        >
          <StatusPill status={status} label={label} />
        </BaseSetting>

        {info.journal && (
          <BaseSetting
            title="Last update"
            subtitle={journalFailed ? undefined : journalText(info.journal, now)}
            error={journalFailed ? journalText(info.journal, now) : undefined}
          >
            <></>
          </BaseSetting>
        )}

        {info.managed && (
          <ButtonSetting
            title="Releases"
            subtitle="Check for updates and install a release"
            label="View releases"
            onClick={() => void navigate("/settings/updates")}
          />
        )}
      </>
    </SettingGroup>
  );
}
