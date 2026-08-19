import { useEffect, useState, type JSX } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import "./updatePage.less";
import { timeAgo } from "../common/helpers/relativeTime";
import { useNow } from "../common/hooks/useNow";
import { Variant } from "../common/types/variants";
import { Button } from "../components/button/Button";
import { LoadingPage } from "../components/layout/loading/LoadingPage";
import { ConfirmModal } from "../components/modal/ConfirmModal";
import { InfoPill } from "../components/pill/InfoPill";
import { ReleaseNotes } from "../components/updates/ReleaseNotes";
import { MessageTone, UpdateMessage } from "../components/updates/UpdateMessage";
import { clearApplyMark, markApplyStarted } from "../components/updates/useUpdateLifecycle";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { UpdateState, type Release, type UpdateInfo } from "../../../src/system/update/model";
import { isNewerVersion } from "../../../src/system/update/version";

/**
 * The Updates page: the release list, per-release notes, and the update lifecycle.
 * Everything rendered here comes off the SSE state; the only requests are check and apply.
 */
export default function UpdatePage(): JSX.Element {
  const { version } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const { setMeta } = usePageContext();
  const now = useNow(30_000); // relative labels only need minute-ish freshness

  const [confirming, setConfirming] = useState<Release | null>(null);

  const info = api.state?.info.update;

  useEffect(() => {
    setMeta(
      { title: [{ label: "Settings", path: "/settings/config" }, { label: "updates", path: "/settings/updates" }, ...(version ? [version] : [])] },
      true,
    );
  }, [setMeta, version]);

  if (!info) return <LoadingPage />;

  const busy =
    info.activity.state === UpdateState.APPLYING || info.activity.state === UpdateState.CHECKING;
  // The journal stays "applying" until the update has proven itself, which is exactly
  // while the server refuses a replacement. Disable rather than let a click fail. Only
  // applies are blocked: looking for releases changes nothing.
  const settling = info.journal?.status === "applying";
  const canApply = !busy && !settling;

  const apply = async (release: Release): Promise<void> => {
    // Marked before the request: a fast update can take the server away while it is still
    // in flight, and without the marker the reload afterwards would explain nothing.
    markApplyStarted(release.version);
    try {
      await api.callBacks.update.apply(release.version);
      if (version !== undefined) void navigate("/settings/updates"); // watch it from the list
    } catch {
      clearApplyMark(); // refused, so no restart is coming
    }
  };

  if (!info.managed) {
    return (
      <div className="updatePage">
        <p className="plainMode">
          This is a git checkout, so updates are managed with git rather than from here.
          Running version {info.current}.
        </p>
      </div>
    );
  }

  // Detail view: one release, with its notes in full.
  if (version !== undefined) {
    const release = info.releases.find((entry) => entry.version === version);
    if (!release)
      return (
        <div className="updatePage">
          <p className="plainMode">
            No release {version} in the last check. <Link to="/settings/updates">Back to updates</Link>
          </p>
        </div>
      );
    return (
      <div className="updatePage">
        <div className="releaseHead">
          <span className="name">{release.name}</span>
          <span className="meta">
            {new Date(release.publishedAt).toLocaleDateString()}
            <ReleaseBadges release={release} current={info.current} />
          </span>
        </div>
        <div className="notesCard">
          <ReleaseNotes body={release.notes} />
        </div>
        {release.version !== info.current && (
          <div className="detailActions">
            <ApplyButton release={release} current={info.current} busy={!canApply} onClick={setConfirming} />
          </div>
        )}
        <ApplyConfirm
          release={confirming}
          current={info.current}
          onClose={() => setConfirming(null)}
          onConfirm={apply}
        />
      </div>
    );
  }

  // List view.
  return (
    <div className="updatePage">
      <div className="listHead">
        <span className="checked">
          {info.lastChecked === null ? "Not checked yet" : `Last checked ${timeAgo(info.lastChecked, now)}`}
        </span>
        <Button size={14} disabled={busy} onClick={() => api.callBacks.update.check()}>
          Check for updates
        </Button>
      </div>

      <UpdateMessages
        info={info}
        settling={settling}
        now={now}
        onAcknowledge={() => api.callBacks.update.acknowledge()}
      />

      <div className="releaseList">
        {info.releases.length === 0 && <div className="empty">No releases found.</div>}
        {info.releases.map((release) => (
          <div className="release" key={release.version}>
            <Link className="titles" to={`/settings/updates/${release.version}`}>
              <span className="name">
                {release.name}
                {release.prerelease && (
                  <InfoPill variant={Variant.WARNING}>
                    <span>beta</span>
                  </InfoPill>
                )}
              </span>
              <span className="meta">
                {release.version} · {new Date(release.publishedAt).toLocaleDateString()}
              </span>
            </Link>
            <span className="action">
              {release.version === info.current ? (
                <InfoPill variant={Variant.SUCCESS}>
                  <span>current</span>
                </InfoPill>
              ) : (
                <ApplyButton release={release} current={info.current} busy={!canApply} onClick={setConfirming} />
              )}
            </span>
          </div>
        ))}
      </div>

      <ApplyConfirm
        release={confirming}
        current={info.current}
        onClose={() => setConfirming(null)}
        onConfirm={apply}
      />
    </div>
  );
}

function ReleaseBadges({ release, current }: { release: Release; current: string }): JSX.Element {
  return (
    <>
      {release.prerelease && (
        <InfoPill variant={Variant.WARNING}>
          <span>beta</span>
        </InfoPill>
      )}
      {release.version === current && (
        <InfoPill variant={Variant.SUCCESS}>
          <span>current</span>
        </InfoPill>
      )}
    </>
  );
}

// An older version is offered as a downgrade rather than hidden: the server's gate is what
// decides whether it is allowed, and it explains itself if not.
function ApplyButton({
  release,
  current,
  busy,
  onClick,
}: {
  release: Release;
  current: string;
  busy: boolean;
  onClick: (release: Release) => void;
}): JSX.Element {
  // One fill for every action here; only the variant says which way the version moves.
  const newer = isNewerVersion(release.version, current);
  return (
    <Button
      size={14}
      variant={newer ? Variant.ACCENT : Variant.DEFAULT}
      disabled={busy}
      onClick={() => onClick(release)}
    >
      {newer ? "Update" : "Downgrade"}
    </Button>
  );
}

function ApplyConfirm({
  release,
  current,
  onClose,
  onConfirm,
}: {
  release: Release | null;
  current: string;
  onClose: () => void;
  onConfirm: (release: Release) => void | Promise<void>;
}): JSX.Element {
  return (
    <ConfirmModal
      open={release !== null}
      onClose={onClose}
      title={`Install ${release?.version}`}
      confirmLabel="Install"
      onConfirm={() => {
        if (release) void onConfirm(release);
      }}
    >
      <p>
        {release !== null && !isNewerVersion(release.version, current)
          ? `This is a downgrade from ${current}. `
          : ""}
        WebKontrol restarts to finish the update, and rolls itself back automatically if the
        new version fails to start.
      </p>
    </ConfirmModal>
  );
}

/**
 * Everything the update system currently has to say, as bubbles. A live condition (a
 * failing check, an update still settling) cannot be dismissed, because hiding it would
 * not make it untrue; a finished outcome can, which is what stops an old rollback from
 * reading as a live alarm forever.
 */
function UpdateMessages({
  info,
  settling,
  now,
  onAcknowledge,
}: {
  info: UpdateInfo;
  settling: boolean;
  now: number;
  onAcknowledge: () => void | Promise<void>;
}): JSX.Element {
  const journal = info.journal;
  const seen = journal?.acknowledged === true;
  return (
    <>
      {info.checkError !== undefined && (
        <UpdateMessage tone={MessageTone.PROBLEM}>Check failed: {info.checkError}</UpdateMessage>
      )}

      {settling && (
        <UpdateMessage tone={MessageTone.INFO}>
          Confirming the update to {journal?.to}. Another one can be installed once it has
          run for a minute without trouble.
        </UpdateMessage>
      )}

      {journal && !settling && journal.status === "ok" && (
        <UpdateMessage tone={MessageTone.INFO}>
          Updated {journal.from} to {journal.to} {timeAgo(journal.moment, now)}.
        </UpdateMessage>
      )}

      {journal && journal.status === "rolled-back" && !seen && (
        <UpdateMessage tone={MessageTone.PROBLEM} onDismiss={onAcknowledge}>
          {journal.to} crashed {timeAgo(journal.moment, now)} and was rolled back to{" "}
          {journal.from}. Nothing was lost.
        </UpdateMessage>
      )}

      {journal && journal.status === "failed" && !seen && (
        <UpdateMessage tone={MessageTone.PROBLEM} onDismiss={onAcknowledge}>
          Updating to {journal.to} failed {timeAgo(journal.moment, now)}
          {journal.error === undefined ? "" : `: ${journal.error}`}
        </UpdateMessage>
      )}
    </>
  );
}
