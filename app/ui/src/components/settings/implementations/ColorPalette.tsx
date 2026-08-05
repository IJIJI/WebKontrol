import { type JSX } from "react/jsx-runtime";

import "./colorSetting.less";
import { COLOR_PALETTE } from "../../../common/appearance";
import { classNames } from "../../../common/helpers/classNames";
import { Icons } from "../../icons/Icons";

/** A colour outside the palette is a custom one. Marked with a pencil, inline and in the modal. */
export const isCustomColor = (c: string): boolean => !COLOR_PALETTE.includes(c);

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// `<input type="color">` only accepts #rrggbb: shorthand must be expanded, and anything else
// (a gradient, `rgba(…)`, a keyword — all valid in a free-CSS colour field) has no representation
// here, so the picker opens on black rather than being silently reset by the browser.
function toPickerHex(value: string | undefined): string {
  if (!value || !HEX.test(value)) return "#000000";
  if (value.length === 7) return value;
  const [, r, g, b] = value;
  return `#${r}${r}${g}${g}${b}${b}`;
}

// The palette body: every preset swatch plus a native custom picker. Shared by the hex-only
// ColorSetting (in its picker modal) and the free-CSS ColorTextSetting (beside its text field),
// so both offer the same colours.
export function ColorPalette({
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
          className={classNames("swatch", "custom", value !== undefined && isCustomColor(value) && "selected")}
          title="Custom colour"
        >
          <input
            type="color"
            value={toPickerHex(value)}
            aria-label="Custom colour"
            onChange={(e) => onSet(e.target.value)}
          />
          <Icons.edit size={16} className="swatchPencil" />
        </label>
      </div>
    </div>
  );
}
