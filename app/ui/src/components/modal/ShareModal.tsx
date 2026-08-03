import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";
import { QRCodeSVG } from "qrcode.react";

import "./shareModal.less";
import { Modal, ModalSize } from "./Modal";
import { CopyButton } from "../copyButton/CopyButton";


export function ShareModal({
  open,
  onClose,
  title,
  url,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  url: string;
  actions: ReactNode; // two buttons; they split the QR's height into a tiled grid
}): JSX.Element | null {
  return (
    <Modal open={open} onClose={onClose} size={ModalSize.SM} title={title}>
      <div className="shareBody">
        <div className="shareMain">
          {/* White card keeps the QR scannable in any theme. */}
          <div className="shareQr">
            <QRCodeSVG value={url} size={168} marginSize={0} />
          </div>
          <div className="shareActions">{actions}</div>
        </div>
        <div className="shareUrlRow">
          <input
            className="shareUrlField"
            type="text"
            value={url}
            readOnly
            title={url}
            onFocus={(e) => e.currentTarget.select()}
          />
          <CopyButton text={url} label="Copy link" />
        </div>
      </div>
    </Modal>
  );
}
