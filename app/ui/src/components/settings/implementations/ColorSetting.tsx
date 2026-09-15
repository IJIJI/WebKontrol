import { type JSX } from "react/jsx-runtime";

import "./colorSetting.less";
import { type BaseSettingProps } from "../BaseSetting";
import { InlinePickerSetting } from "./InlinePickerSetting";
import { ColorPalette, isCustomColor } from "./ColorPalette";
import { COLOR_PALETTE } from "../../../common/appearance";
import { Icons } from "../../icons/Icons";

// Colour picker for a plain colour value (entity appearance): the full palette inline + a modal
// that adds the native custom picker as a swatch.
export function ColorSetting(props: BaseSettingProps<string | undefined>): JSX.Element {
  return (
    <InlinePickerSetting
      {...props}
      suggestions={COLOR_PALETTE}
      clearTitle="Default (no colour)"
      modalTitle="Choose colour"
      renderChip={(c) => (
        <span className="swatchFill" style={{ backgroundColor: c }}>
          {isCustomColor(c) && <Icons.edit size={12} className="swatchPencil" />}
        </span>
      )}
      renderModal={(select, set) => <ColorPalette value={props.value} onSelect={select} onSet={set} />}
    />
  );
}
