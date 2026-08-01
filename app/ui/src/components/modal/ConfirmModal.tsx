import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { Modal, ModalSize } from "./Modal";
import { Button } from "../button/Button";
import { FillStyle, Variant } from "../../helpers/variants";

// A small yes/no dialog: a message body plus Cancel/Confirm. Generic: the assign-view flow, delete, 
// duplicate, … all compose it. `onConfirm` fires, then the modal closes.
export function ConfirmModal({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Confirm",
  confirmVariant = Variant.ACCENT,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  confirmLabel?: string;
  confirmVariant?: Variant;
  onConfirm: () => void | Promise<void>;
}): JSX.Element {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={ModalSize.SM}
      footer={
        <>
          <Button fillStyle={FillStyle.SKELETON} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={() => {
              void onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
