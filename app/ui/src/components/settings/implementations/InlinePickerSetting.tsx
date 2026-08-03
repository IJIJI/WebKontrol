import { useState, type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./inlinePickerSetting.less";
import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { RestoreButton } from "../RestoreButton";
import { Modal } from "../../modal/Modal";
import { Icons } from "../../icons/Icons";
import { classNames } from "../../../common/helpers/classNames";

// Base for value pickers (colour, icon): an inline chip strip — a "clear" chip, the current + saved
// value, a few suggestions, and a "more" chip that opens the full picker in a modal. Wrappers supply
// how a value renders (renderChip) and the modal body (renderModal). Selection = set + close.
type InlinePickerProps = BaseSettingProps<string | undefined> & {
  suggestions: string[];
  renderChip: (id: string) => ReactNode;
  clearTitle?: string;
  modalTitle?: ReactNode;
  // `select` sets the value and closes the modal; `set` sets without closing (e.g. a live custom
  // picker the user keeps adjusting).
  renderModal: (select: (id: string | undefined) => void, set: (id: string | undefined) => void) => ReactNode;
};

export function InlinePickerSetting(props: InlinePickerProps): JSX.Element {
  const { value, savedVal } = props;
  const [modalOpen, setModalOpen] = useState(false);

  const changed = savedVal !== undefined && savedVal !== value;
  const restore = (): void => {
    if (savedVal !== undefined) void props.setValue(savedVal);
  };

  const set = (id: string | undefined): void => void props.setValue(id);
  const select = (id: string | undefined): void => {
    set(id);
    setModalOpen(false);
  };

  // Suggestions keep a fixed order (so selecting never reshuffles them); the current + saved
  // values are appended only if they aren't already a suggestion (e.g. a custom colour / searched
  // icon), so out-of-list picks still show without moving anything.
  const extras = [...new Set([value, savedVal].filter((v): v is string => !!v))].filter(
    (v) => !props.suggestions.includes(v),
  );
  const ids = [...props.suggestions, ...extras];

  return (
    <BaseSetting {...props} changed={changed}>
      {changed ? <RestoreButton onClick={restore} /> : <></>}
      <div className="inlineStrip">
        <button
          type="button"
          className={classNames("pickerChip", "clear", !value && "selected")}
          title={props.clearTitle ?? "Default"}
          onClick={() => select(undefined)}
        >
          <Icons.close size={14} />
        </button>
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            className={classNames(
              "pickerChip",
              value === id && "selected",
              savedVal === id && value !== id && "saved",
            )}
            title={id}
            onClick={() => select(id)}
          >
            {props.renderChip(id)}
          </button>
        ))}
        <button type="button" className="pickerChip more" title="More…" onClick={() => setModalOpen(true)}>
          <Icons.more size={16} />
        </button>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={props.modalTitle}>
        {props.renderModal(select, set)}
      </Modal>
    </BaseSetting>
  );
}
