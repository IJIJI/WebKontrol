import { type JSX } from "react/jsx-runtime";

import "./colorSetting.less";
import "./rangeSetting.less";
import { COLOR_PALETTE } from "../../../common/appearance";
import { classNames } from "../../../common/helpers/classNames";
import { Icons } from "../../icons/Icons";
import { formatHexAlpha, parseHexAlpha } from "./cssColor";

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
  alpha = false,
}: {
  value: string | undefined;
  onSelect: (c: string) => void; // palette pick: set + close
  onSet: (c: string) => void; // custom picker: set, keep open while adjusting
  // Opt-in: composes `#rrggbbaa`, which only hosts accepting a free CSS colour can store.
  // ColorSetting's value is a plain hex colour and its schema rejects the eight-digit form.
  alpha?: boolean;
}): JSX.Element {
  // Only hex carries an alpha channel; a gradient or a keyword has nothing to attach one to.
  const parsed = alpha ? parseHexAlpha(value) : null;
  // Picking a colour keeps the transparency already set, rather than silently resetting it.
  const withAlpha = (c: string): string => (parsed === null ? c : formatHexAlpha(c, parsed.alpha));

  return (
    <div className="colorModal">
      <div className="colorSwatches">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className={classNames("swatch", (parsed?.rgb ?? value) === c && "selected")}
            style={{ backgroundColor: c }}
            title={c}
            aria-label={c}
            onClick={() => onSelect(withAlpha(c))}
          />
        ))}
        <label
          className={classNames("swatch", "custom", value !== undefined && isCustomColor(value) && "selected")}
          title="Custom colour"
        >
          <input
            type="color"
            value={toPickerHex(parsed?.rgb ?? value)}
            aria-label="Custom colour"
            onChange={(e) => onSet(withAlpha(e.target.value))}
          />
          <Icons.edit size={16} className="swatchPencil" />
        </label>
      </div>

      {parsed !== null && (
        // Its own control rather than part of the native picker, which is RGB-only by spec.
        // The track shows the colour fading over a checkerboard, so the slider reads as
        // transparency rather than as a number.
        <label className="colorAlpha">
          <span className="alphaLabel">Opacity</span>
          <input
            type="range"
            className="rangeSlider alphaSlider"
            style={{ "--alpha-color": parsed.rgb, "--fill-start": "0%", "--fill-end": "0%" } as React.CSSProperties}
            min={0}
            max={1}
            step={0.01}
            value={parsed.alpha}
            onChange={(e) => onSet(formatHexAlpha(parsed.rgb, e.target.valueAsNumber))}
          />
          <span className="alphaValue">{Math.round(parsed.alpha * 100)}%</span>
        </label>
      )}
    </div>
  );
}
