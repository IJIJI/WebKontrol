import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";

import "./updateOverlay.less";
import { FillStyle, Variant } from "../../common/types/variants";
import { Button } from "../button/Button";
import { Icons } from "../icons/Icons";
import { Modal, ModalSize } from "../modal/Modal";
import { UpdatePhase } from "./updatePhase";

// How often to ask whether the new version is serving yet. A restart is seconds, an
// update that has to reinstall dependencies can be minutes; either way this is cheap.
const POLL_INTERVAL_MS = 2000;

/**
 * What an update looks like while it happens. The applying and restarting phases block
 * the whole screen on purpose: the server is about to go away, so nothing else on the
 * page can be trusted to work. The outcomes are dismissible modals instead.
 */
export function UpdateOverlay({
  phase,
  target,
  error,
  onDismiss,
}: {
  phase: UpdatePhase;
  /** The version being installed, or the one that was attempted. */
  target: string | null;
  /** Why it failed; shown for FAILED and ROLLED_BACK. */
  error?: string;
  onDismiss: () => void;
}): JSX.Element | null {
  const navigate = useNavigate();

  // The client has no SSE reconnect, so a full reload is how we come back after the
  // restart. GET / only answers once the whole server (including the SPA middleware) is
  // up, which is exactly the readiness we need.
  useEffect(() => {
    if (phase !== UpdatePhase.RESTARTING) return;
    const timer = setInterval(() => {
      void fetch("/", { method: "HEAD" })
        .then((response) => {
          if (response.ok) window.location.reload();
        })
        .catch(() => {
          /* still down; keep polling */
        });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [phase]);

  switch (phase) {
    case UpdatePhase.NONE:
      return null;

    case UpdatePhase.APPLYING:
    case UpdatePhase.RESTARTING:
      return (
        <div className="updateOverlay">
          <Icons.loading size={64} />
          <span className="title">
            {phase === UpdatePhase.APPLYING ? "Updating WebKontrol" : "Restarting"}
          </span>
          <span className="detail">
            {phase === UpdatePhase.APPLYING
              ? `Downloading and installing ${target ?? "the update"}. Displays keep showing their current page.`
              : "Waiting for the new version to come up. This page reloads itself."}
          </span>
        </div>
      );

    case UpdatePhase.DONE:
      return (
        <Modal
          open
          onClose={onDismiss}
          size={ModalSize.SM}
          title="Update complete"
          footer={
            <>
              <Button fillStyle={FillStyle.SKELETON} onClick={onDismiss}>
                Stay here
              </Button>
              <Button variant={Variant.ACCENT} onClick={() => void navigate("/puppets")}>
                Go to displays
              </Button>
            </>
          }
        >
          <p>Now running {target}.</p>
        </Modal>
      );

    case UpdatePhase.ROLLED_BACK:
      return (
        <Modal
          open
          onClose={onDismiss}
          size={ModalSize.SM}
          title="Update rolled back"
          footer={
            <Button variant={Variant.ACCENT} onClick={onDismiss}>
              Back to updates
            </Button>
          }
        >
          <p>
            {target} would not start, so the previous version was restored automatically,
            database included. Nothing was lost.
          </p>
          {error !== undefined && <pre className="updateError">{error}</pre>}
        </Modal>
      );

    case UpdatePhase.FAILED:
      return (
        <Modal
          open
          onClose={onDismiss}
          size={ModalSize.SM}
          title="Update failed"
          footer={
            <Button variant={Variant.ACCENT} onClick={onDismiss}>
              Back to updates
            </Button>
          }
        >
          <p>
            Installing {target} did not finish, so nothing was changed and the current
            version keeps running.
          </p>
          {error !== undefined && <pre className="updateError">{error}</pre>}
        </Modal>
      );
  }
}
