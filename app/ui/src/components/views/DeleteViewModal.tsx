import { useEffect, useState } from "react";
import { type JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";

import { useApi, type UiViewState } from "../../context/ApiStateContext";
import { ConfirmModal } from "../modal/ConfirmModal";
import { SelectSetting } from "../settings/implementations/SelectSetting";
import { Variant } from "../../common/types/variants";

export function DeleteViewModal({
  open,
  onClose,
  view,
}: {
  open: boolean;
  onClose: () => void;
  view: UiViewState;
}): JSX.Element {
  const navigate = useNavigate();
  const { state } = useApi();

  // "" = leave the freed puppets blank (no replacement).
  const [replacement, setReplacement] = useState<string>("");
  useEffect(() => {
    if (open) setReplacement("");
  }, [open]);

  const assignments = state?.runtime.puppetOrchestrator.assignments ?? {};
  const affectedKeys = Object.entries(assignments)
    .filter(([, viewKey]) => viewKey === view.key)
    .map(([puppetKey]) => puppetKey);
  const affectedNames = affectedKeys.map(
    (key) => state?.puppets.get(key)?.config.name.long ?? state?.puppets.get(key)?.config.name.short ?? key,
  );

  const otherViews = state ? [...state.views.values()].filter((v) => v.key !== view.key) : [];
  const replacementOptions = [
    { label: "Leave blank", value: "" },
    ...otherViews.map((v) => ({ label: v.config.name.long, value: v.key })),
  ];

  const onConfirm = async (): Promise<void> => {
    if (replacement && affectedKeys.length) {
      await state?.views.get(replacement)?.assign(affectedKeys);
    }
    await view.delete();
    void navigate("/views");
  };

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title={
        <span>
          Delete{" "}
          <b>
            <code>{view.config.name.long}</code>
          </b>
          ?
        </span>
      }
      confirmLabel="Delete"
      confirmVariant={Variant.DANGER}
      onConfirm={onConfirm}
    >
      <p>This can&apos;t be undone.</p>
      {affectedKeys.length > 0 && (
        <>
          <p>
            It&apos;s currently on <b>{affectedNames.join(", ")}</b>.
          </p>
          <SelectSetting
            title="Replace with"
            subtitle="Optional"
            value={replacement}
            setValue={setReplacement}
            options={replacementOptions}
          />
        </>
      )}
    </ConfirmModal>
  );
}
