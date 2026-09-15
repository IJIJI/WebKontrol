import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./iconSetting.less";
import { type BaseSettingProps } from "../BaseSetting";
import { InlinePickerSetting } from "./InlinePickerSetting";
import { ALL_ICON_IDS, COMMON_ICONS, Icon } from "../../icons/Icon";
import { classNames } from "../../../common/helpers/classNames";

// Icon picker: inline strip (current + saved + a few common) + a modal with the full searchable grid.
export function IconSetting(props: BaseSettingProps<string | undefined>): JSX.Element {
  return (
    <InlinePickerSetting
      {...props}
      suggestions={COMMON_ICONS}
      clearTitle="Default (view type)"
      modalTitle="Choose icon"
      renderChip={(id) => <Icon id={id} size={18} />}
      renderModal={(select) => <IconModalBody value={props.value} onSelect={select} />}
    />
  );
}

function IconModalBody({
  value,
  onSelect,
}: {
  value: string | undefined;
  onSelect: (id: string) => void;
}): JSX.Element {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const ids = q ? ALL_ICON_IDS.filter((id) => id.toLowerCase().includes(q)) : ALL_ICON_IDS;

  return (
    <div className="iconModal">
      <input
        type="text"
        className="textfield"
        placeholder="Search icons…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="iconGrid">
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            className={classNames("iconOption", value === id && "selected")}
            title={id}
            aria-label={id}
            onClick={() => onSelect(id)}
          >
            <Icon id={id} size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}
