import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./rangeSetting.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";

type RangeProps = InputSettingProps<number | undefined> & {
  min?: number;
  max?: number;
  step?: number;
};

/** Zero, clamped into the range: the neutral point of a numeric field and the fill's origin. */
function anchorValue(min: number | undefined, max: number | undefined): number {
  return Math.min(Math.max(0, min ?? 0), max ?? 0);
}

/**
 * Where to park the thumb while the field is unset. A slider always has a thumb, so it would
 * otherwise claim a value the field does not hold, and at the wrong end. Defaults to the anchor
 * so an unset slider shows a zero-width fill exactly where the fill starts, which is right
 * without the field declaring anything (an unset rotation is 0, i.e. centred). A field whose
 * empty state means something else says so through its placeholder, which already reads as
 * "what you get if you leave this blank": unset opacity renders fully opaque, so it rests at 1.
 */
function restingValue(placeholder: string | undefined, min: number | undefined, max: number | undefined): number {
  const declared = placeholder === undefined || placeholder === "" ? NaN : Number(placeholder);
  return Number.isFinite(declared) ? declared : anchorValue(min, max);
}

/**
 * Where the track's filled section starts and ends, as CSS custom properties the stylesheet
 * paints a gradient with. Anchored at zero, so it fills from the left for a range that starts
 * at zero and outwards from the middle for one that straddles it.
 */
function fillBounds(value: number, min: number | undefined, max: number | undefined): Record<string, string> {
  if (min === undefined || max === undefined || max <= min) return {};
  const percent = (v: number): number => ((v - min) / (max - min)) * 100;
  const anchor = percent(anchorValue(min, max));
  const current = percent(value);
  return {
    "--fill-start": `${Math.min(anchor, current)}%`,
    "--fill-end": `${Math.max(anchor, current)}%`,
  };
}

// A bounded number as a slider *plus* its number box: dragging is the point, but a slider alone
// can't express an exact value or show what the current one is. Both edit the same field, so the
// number box stays the way to type a precise value (and to clear an optional one).
export function RangeSetting(props: RangeProps): JSX.Element {
  const { min, max, step } = props;
  const unset = !Number.isFinite(props.value);
  const sliderValue = unset ? restingValue(props.placeholder, min, max) : (props.value as number);

  return (
    <ValueSetting {...props}>
      {({ changed, inputRef }) => (
        <>
          <input
            type="range"
            className={"rangeSlider" + (unset ? " unset" : "")}
            // The filled part of the track runs between zero and the value, rather than from the
            // left edge: zero is the neutral point of any numeric field, so a 0-to-1 opacity
            // fills from its left end while a -180-to-180 rotation fills out from its middle.
            style={fillBounds(sliderValue, min, max)}
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={(event) => void props.setValue(event.target.valueAsNumber)}
            // The row focuses the number box on click; without this, letting the click bubble
            // would pull focus off the slider the moment you finish dragging it.
            onClick={(event) => event.stopPropagation()}
            disabled={props.disabled}
            aria-label={props.title}
          />
          <input
            className={"textfield rangeNumber" + (changed ? " changed" : "")}
            type="number"
            min={min}
            max={max}
            step={step}
            placeholder={props.placeholder}
            ref={inputRef}
            value={Number.isFinite(props.value) ? props.value : ""}
            onChange={(event) => {
              const value = event.target.valueAsNumber;
              void props.setValue(Number.isNaN(value) ? undefined : value);
            }}
            disabled={props.disabled}
          />
        </>
      )}
    </ValueSetting>
  );
}
