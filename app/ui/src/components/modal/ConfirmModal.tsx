import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { Modal, ModalSize } from "./Modal";
import { Button } from "../button/Button";
import { FillStyle, Variant } from "../../helpers/variants";
import { SettingWidth, SettingWidthContext } from "../settings/settingWidth";

// A small yes/no dialog: a message body plus Cancel/Confirm. Generic: the assign-view flow, delete, 
// duplicate, … all compose it. `onConfirm` fires, then the modal closes.
export function ConfirmModal({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Confirm",
  confirmVariant = Variant.ACCENT,
  size = ModalSize.SM,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  confirmLabel?: string;
  confirmVariant?: Variant;
  size?: ModalSize;
  onConfirm: () => void | Promise<void>;
}): JSX.Element {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
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
      {/* A small/medium modal is too narrow for the wide (label-left) setting layout — stack them. */}
      <SettingWidthContext.Provider
        value={size === ModalSize.LG ? SettingWidth.WIDE : SettingWidth.COMPACT}
      >
        {children}
      </SettingWidthContext.Provider>
    </Modal>
  );
}
