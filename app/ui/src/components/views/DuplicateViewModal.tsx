import { useEffect, useState } from "react";
import { type JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";

import { useApi, type UiViewState } from "../../context/ApiStateContext";
import { ConfirmModal } from "../modal/ConfirmModal";
import { DisplayNameSetting } from "../settings/implementations/DisplayNameSetting";
import { type DisplayName } from "../../../../src/types/CommonTypes";

export function DuplicateViewModal({
  open,
  onClose,
  view,
}: {
  open: boolean;
  onClose: () => void;
  view: UiViewState;
}): JSX.Element {
  const navigate = useNavigate();
  const { callBacks } = useApi();

  const [name, setName] = useState<DisplayName>(view.config.name);
  useEffect(() => {
    if (open) setName({ long: `Copy of ${view.config.name.long}`, short: `CPY - ${view.config.name.short}` }); // TODO: Max length might not work with this
  }, [open, view.config.name]);

  const onConfirm = async (): Promise<void> => {
    const key = await callBacks.view.create({ ...view.config, name });
    void navigate(`/views/${key}`);
  };

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title={
        <span>
          Duplicate{" "}
          <b>
            <code>{view.config.name.long}</code>
          </b>
        </span>
      }
      confirmLabel="Duplicate"
      onConfirm={onConfirm}
    >
      <DisplayNameSetting
        title="Name"
        subtitle="Name for the copy, long and short"
        value={name}
        setValue={(v) => setName({ long: v.long ?? "", short: v.short ?? "" })}
      />
    </ConfirmModal>
  );
}
