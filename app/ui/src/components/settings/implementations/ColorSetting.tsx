import { type JSX } from "react/jsx-runtime";

import "./colorSetting.less";
import { type BaseSettingProps } from "../BaseSetting";
import { InlinePickerSetting } from "./InlinePickerSetting";
import { COLOR_PALETTE } from "../../../common/appearance";
import { classNames } from "../../../common/helpers/classNames";
import { Icons } from "../../icons/Icons";

// A colour not in the palette is a custom one. Marked with a pencil, inline and in the modal.
const isCustom = (c: string): boolean => !COLOR_PALETTE.includes(c);

// Colour picker: the full palette inline + a modal that adds the native custom picker as a swatch.
export function ColorSetting(props: BaseSettingProps<string | undefined>): JSX.Element {
  return (
    <InlinePickerSetting
      {...props}
      suggestions={COLOR_PALETTE}
      clearTitle="Default (no colour)"
      modalTitle="Choose colour"
      renderChip={(c) => (
        <span className="swatchFill" style={{ backgroundColor: c }}>
          {isCustom(c) && <Icons.edit size={12} className="swatchPencil" />}
        </span>
      )}
      renderModal={(select, set) => <ColorModalBody value={props.value} onSelect={select} onSet={set} />}
    />
  );
}

function ColorModalBody({
  value,
  onSelect,
  onSet,
}: {
  value: string | undefined;
  onSelect: (c: string) => void; // palette pick: set + close
  onSet: (c: string) => void; // custom picker: set, keep open while adjusting
}): JSX.Element {
  return (
    <div className="colorModal">
      <div className="colorSwatches">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className={classNames("swatch", value === c && "selected")}
            style={{ backgroundColor: c }}
            title={c}
            aria-label={c}
            onClick={() => onSelect(c)}
          />
        ))}
        <label
          className={classNames("swatch", "custom", value !== undefined && isCustom(value) && "selected")}
          title="Custom colour"
        >
          <input
            type="color"
            value={value ?? "#000000"}
            aria-label="Custom colour"
            onChange={(e) => onSet(e.target.value)}
          />
          <Icons.edit size={16} className="swatchPencil" />
        </label>
      </div>
    </div>
  );
}
