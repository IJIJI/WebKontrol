import { useEffect, useState, type JSX } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import "./updatePage.less";
import { timeAgo } from "../common/helpers/relativeTime";
import { useNow } from "../common/hooks/useNow";
import { FillStyle, Variant } from "../common/types/variants";
import { Button } from "../components/button/Button";
import { LoadingPage } from "../components/layout/loading/LoadingPage";
import { ConfirmModal } from "../components/modal/ConfirmModal";
import { InfoPill } from "../components/pill/InfoPill";
import { ReleaseNotes } from "../components/updates/ReleaseNotes";
import { UpdateOverlay } from "../components/updates/UpdateOverlay";
import { updatePhase, UpdatePhase } from "../components/updates/updatePhase";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { ConnectionStatus } from "../context/types";
import { UpdateState, type Release } from "../../../src/system/update/model";
import { isNewerVersion } from "../../../src/system/update/version";

// Survives the restart an update ends in, which is the only reason the browser can say
// anything about the outcome at all.
const PENDING_KEY = "wk-update-target";

// Read ONCE per document: a marker present at load time means the previous document was
// taken away by an update, so this load is the one that comes after it. A component-level
// read could not tell that apart from an apply started a second ago.
const RESTARTED_INTO: string | null =
  typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(PENDING_KEY);

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

  const [applyingTarget, setApplyingTarget] = useState<string | null>(null);
  const [sawRestart, setSawRestart] = useState(false);
  const [confirming, setConfirming] = useState<Release | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const info = api.state?.info.update;
  const connected = api.status !== ConnectionStatus.DISCONNECTED;
  const activity = info?.activity.state;

  // The server going away is how a successful apply ends, so remember it: everything
  // after it is the aftermath, whether or not the connection has come back yet.
  useEffect(() => {
    if (applyingTarget !== null && !connected) setSawRestart(true);
  }, [applyingTarget, connected]);

  /**
   * Reload once our own apply has concluded. Two reasons this is not optional: the client
   * is still running the previous version's bundle against the new server, and the outcome
   * modal reads a marker that only a fresh document can distinguish from an apply in
   * flight. Arriving on the target version is proof enough on its own; a rollback shows up
   * as the connection returning on a version that is not the one asked for.
   */
  useEffect(() => {
    if (applyingTarget === null || info === undefined) return;
    if (activity === UpdateState.APPLYING || activity === UpdateState.FAILED) return;
    if (info.current === applyingTarget || (sawRestart && connected)) window.location.reload();
  }, [applyingTarget, sawRestart, connected, activity, info]);

  // An outcome has been read out of the marker, so retire it: reloading again (or opening
  // the page later) must not replay a story that has already been told.
  useEffect(() => {
    if (RESTARTED_INTO !== null) sessionStorage.removeItem(PENDING_KEY);
  }, []);

  useEffect(() => {
    setMeta(
      { title: [{ label: "Settings", path: "/settings/config" }, { label: "updates", path: "/settings/updates" }, ...(version ? [version] : [])] },
      true,
    );
  }, [setMeta, version]);

  if (!info) return <LoadingPage />;

  const phase = dismissed
    ? UpdatePhase.NONE
    : updatePhase({
        activity: info.activity.state,
        connected,
        applyingTarget,
        sawRestart,
        restartedInto: RESTARTED_INTO,
        current: info.current,
      });

  const busy =
    info.activity.state === UpdateState.APPLYING || info.activity.state === UpdateState.CHECKING;

  const apply = async (release: Release): Promise<void> => {
    // Written before the request: a fast update can take the server away while it is still
    // in flight, and without the marker the reload afterwards would explain nothing.
    sessionStorage.setItem(PENDING_KEY, release.version);
    setApplyingTarget(release.version);
    try {
      await api.callBacks.update.apply(release.version);
      if (version !== undefined) void navigate("/settings/updates"); // watch it from the list
    } catch {
      // Refused (or never reached the runner): no restart is coming, so drop the marker.
      sessionStorage.removeItem(PENDING_KEY);
      setApplyingTarget(null);
    }
  };

  const dismissOutcome = (): void => {
    sessionStorage.removeItem(PENDING_KEY);
    setApplyingTarget(null);
    setDismissed(true);
  };

  const overlay = (
    <UpdateOverlay
      phase={phase}
      target={applyingTarget ?? RESTARTED_INTO}
      error={
        info.activity.state === UpdateState.FAILED
          ? info.activity.error
          : info.journal?.status === "rolled-back"
            ? info.journal.error
            : undefined
      }
      onDismiss={dismissOutcome}
    />
  );

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
        {overlay}
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
            <ApplyButton release={release} current={info.current} busy={busy} onClick={setConfirming} />
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
      {overlay}
      <div className="listHead">
        <span className="checked">
          {info.lastChecked === null ? "Not checked yet" : `Last checked ${timeAgo(info.lastChecked, now)}`}
        </span>
        <Button
          size={14}
          fillStyle={FillStyle.SKELETON}
          disabled={busy}
          onClick={() => api.callBacks.update.check()}
        >
          Check for updates
        </Button>
      </div>

      {info.checkError !== undefined && <p className="checkError">{info.checkError}</p>}
      {info.journal && <JournalLine journal={info.journal} now={now} />}

      <div className="releaseList">
        {info.releases.length === 0 && <div className="empty">No releases found.</div>}
        {info.releases.map((release) => (
          <div className="release" key={release.version}>
            <Link className="titles" to={`/settings/updates/${release.version}`}>
              <span className="name">
                {release.name}
                <ReleaseBadges release={release} current={info.current} />
              </span>
              <span className="meta">
                {release.version} · {new Date(release.publishedAt).toLocaleDateString()}
              </span>
            </Link>
            {release.version !== info.current && (
              <ApplyButton release={release} current={info.current} busy={busy} onClick={setConfirming} />
            )}
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
        <InfoPill variant={Variant.WARNING} fillStyle={FillStyle.SKELETON} size={11}>
          <span>beta</span>
        </InfoPill>
      )}
      {release.version === current && (
        <InfoPill variant={Variant.SUCCESS} fillStyle={FillStyle.SKELETON} size={11}>
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
  const newer = isNewerVersion(release.version, current);
  return (
    <Button
      size={14}
      variant={newer ? Variant.ACCENT : Variant.DEFAULT}
      fillStyle={newer ? FillStyle.FILLED : FillStyle.SKELETON}
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

function JournalLine({
  journal,
  now,
}: {
  journal: NonNullable<ReturnType<typeof useApi>["state"]>["info"]["update"]["journal"] & object;
  now: number;
}): JSX.Element | null {
  const when = timeAgo(journal.moment, now);
  switch (journal.status) {
    case "ok":
      return <p className="journal">Updated {journal.from} to {journal.to} {when}.</p>;
    case "rolled-back":
      return (
        <p className="journal bad">
          {journal.to} crashed {when} and was rolled back to {journal.from}.
        </p>
      );
    case "failed":
      return (
        <p className="journal bad">
          Updating to {journal.to} failed {when}: {journal.error ?? "unknown error"}
        </p>
      );
    case "applying":
      return null; // the overlay is already telling this story
  }
}
