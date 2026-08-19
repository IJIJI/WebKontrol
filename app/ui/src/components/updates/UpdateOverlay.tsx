import { useEffect, type JSX } from "react";
import { createPortal } from "react-dom";
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
      // Portaled to <body>: `main.content` has `contain: layout`, which makes it the
      // containing block for fixed positioning, so an in-place overlay would cover the
      // content column only and leave the list showing around it.
      return createPortal(
        <div className="updateOverlay">
          <span className="badge">
            <Icons.loading size={40} />
          </span>
          <span className="title">
            {phase === UpdatePhase.APPLYING ? "Updating WebKontrol" : "Restarting"}
          </span>
          <span className="detail">
            {phase === UpdatePhase.APPLYING
              ? `Downloading and installing ${target ?? "the update"}. Puppets keep showing their current page.`
              : "Waiting for the new version to come up. This page reloads itself."}
          </span>
        </div>,
        document.body,
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
                Go to puppets
              </Button>
            </>
          }
        >
          <div className="updateOutcome">
            <span className="badge success">
              <Icons.check size={26} />
            </span>
            <p>Now running {target}.</p>
          </div>
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
          <div className="updateOutcome">
            <span className="badge danger">
              <Icons.alert size={26} />
            </span>
            <p>
              {target} would not start, so the previous version was restored automatically,
              database included. Nothing was lost.
            </p>
          </div>
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
          <div className="updateOutcome">
            <span className="badge danger">
              <Icons.alert size={26} />
            </span>
            <p>
              Installing {target} did not finish, so nothing was changed and the current
              version keeps running.
            </p>
          </div>
          {error !== undefined && <pre className="updateError">{error}</pre>}
        </Modal>
      );
  }
}
