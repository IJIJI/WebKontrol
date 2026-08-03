import { type JSX } from "react/jsx-runtime";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

import "./shareViewModal.less";
import { type UiViewState } from "../../context/ApiStateContext";
import { Modal, ModalSize } from "../modal/Modal";
import { Button } from "../button/Button";
import { FillStyle } from "../../common/types/variants";
import { Icons } from "../icons/Icons";

// The "share this view" flow: three ways to get the same serve URL onto a screen — scan the QR,
// copy the link, or open it here. There's no server-side share concept; it's just the URL.
// Controlled + nullable `view` so the same instance serves the header and a collection row.
export function ShareViewModal({
  open,
  onClose,
  view,
}: {
  open: boolean;
  onClose: () => void;
  view?: UiViewState;
}): JSX.Element | null {
  if (!view) return null;

  // Absolute so it's reachable from another device; the UI and views share an origin.
  const url = `${window.location.origin}/view/${view.key}`;

  const copy = (): void => {
    void navigator.clipboard.writeText(url).then(
      () => toast("Link copied"),
      () => toast.error("Copy failed"),
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={ModalSize.SM}
      title={
        <span>
          Share{" "}
          <b>
            <code>{view.config.name.long}</code>
          </b>
        </span>
      }
    >
      <div className="shareBody">
        <div className="shareMain">
          {/* White card keeps the QR scannable in any theme. */}
          <div className="shareQr">
            <QRCodeSVG value={url} size={168} marginSize={0} />
          </div>
          <div className="shareActions">
            <Button fillStyle={FillStyle.FILLED} onClick={copy}>
              <Icons.copy />
              <span>Copy link</span>
            </Button>
            <Button
              fillStyle={FillStyle.FILLED}
              onClick={() => void window.open(url, "_blank", "noopener")}
            >
              <Icons.openInNew />
              <span>Open</span>
            </Button>
          </div>
        </div>
        <div className="shareUrl" title={url}>
          {url}
        </div>
      </div>
    </Modal>
  );
}
