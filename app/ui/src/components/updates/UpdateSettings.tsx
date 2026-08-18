import { useState, type JSX } from "react";

import "./updateSettings.less";
import { ConnectionState } from "../../../../src/types/CommonTypes";
import { UpdateState, type Release, type UpdateInfo } from "../../../../src/system/update/model";
import type { UpdateJournalEntry } from "../../../../src/system/update/schema";
import { isNewerVersion } from "../../../../src/system/update/version";
import { timeAgo } from "../../common/helpers/relativeTime";
import { useNow } from "../../common/hooks/useNow";
import { FillStyle, Variant } from "../../common/types/variants";
import { useApi } from "../../context/ApiStateContext";
import { Button } from "../button/Button";
import { ConfirmModal } from "../modal/ConfirmModal";
import { InfoPill } from "../pill/InfoPill";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { BaseSetting } from "../settings/BaseSetting";
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
      return `Update to ${journal.to} crashed ${when}; automatically rolled back to ${journal.from}`;
    case "failed":
      return `Update to ${journal.to} failed ${when}: ${journal.error ?? "unknown error"}`;
  }
}

/**
 * The Updates section of Settings: status + check, the last update's outcome, and the release list
 * with per-release install. Everything shown rides the SSE state's `update` section; the
 * two buttons are the only requests. On a plain git checkout this collapses to a
 * "Managed by git" pill.
 */
export function UpdateSettings(): JSX.Element | null {
  const api = useApi();
  const info = api.state?.info.update;
  const now = useNow(30_000); // relative labels only need minute-ish freshness
  const [confirming, setConfirming] = useState<Release | null>(null);

  if (!info) return null;

  const { status, label } = describe(info);
  const busy =
    info.activity.state === UpdateState.APPLYING || info.activity.state === UpdateState.CHECKING;
  const journalFailed =
    info.journal?.status === "failed" || info.journal?.status === "rolled-back";

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
          <span className="updateActions">
            <StatusPill status={status} label={label} />
            {info.managed && (
              <Button
                size={14}
                fillStyle={FillStyle.SKELETON}
                disabled={busy}
                onClick={() => void api.callBacks.update.check()}
              >
                Check
              </Button>
            )}
          </span>
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

        {info.managed && info.releases.length > 0 && (
          <div className="releaseList">
            {info.releases.map((release) => {
              const current = release.version === info.current;
              const newer = isNewerVersion(release.version, info.current);
              return (
                <div className="release" key={release.version}>
                  <div className="head">
                    <div className="titles">
                      <span className="name">{release.name}</span>
                      <span className="meta">
                        {release.version}
                        {" · "}
                        {new Date(release.publishedAt).toLocaleDateString()}
                        {release.prerelease && " · pre-release"}
                      </span>
                    </div>
                    {current ? (
                      <InfoPill variant={Variant.SUCCESS} fillStyle={FillStyle.SKELETON}>
                        <span>Current</span>
                      </InfoPill>
                    ) : (
                      <Button
                        size={14}
                        variant={newer ? Variant.ACCENT : Variant.DEFAULT}
                        fillStyle={newer ? FillStyle.FILLED : FillStyle.SKELETON}
                        disabled={busy}
                        onClick={() => setConfirming(release)}
                      >
                        {newer ? "Update" : "Downgrade"}
                      </Button>
                    )}
                  </div>
                  {release.notes !== "" && (
                    <details>
                      <summary>Release notes</summary>
                      <pre className="notes">{release.notes}</pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <ConfirmModal
          open={confirming !== null}
          onClose={() => setConfirming(null)}
          title={`Install ${confirming?.version}`}
          confirmLabel="Install"
          onConfirm={() => {
            if (confirming) void api.callBacks.update.apply(confirming.version);
          }}
        >
          <p>
            {confirming !== null && !isNewerVersion(confirming.version, info.current)
              ? `This is a downgrade from ${info.current}. `
              : ""}
            The system restarts to finish the update, and rolls itself back if the new
            version fails to start.
          </p>
        </ConfirmModal>
      </>
    </SettingGroup>
  );
}
