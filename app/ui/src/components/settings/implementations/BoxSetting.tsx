import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./boxSetting.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { Icons } from "../../icons/Icons";
import { classNames } from "../../../common/helpers/classNames";
import { BOX_UNITS, formatBox, isUniform, parseBox, type BoxSides, type BoxValue } from "./cssBox";

const SIDE_LABELS = ["Top", "Right", "Bottom", "Left"];
const CORNER_LABELS = ["Top left", "Top right", "Bottom right", "Bottom left"];

type BoxProps = InputSettingProps<string | undefined> & {
  /** Border-radius addresses corners rather than sides; only the labels differ. */
  corners?: boolean;
};

/**
 * A CSS box shorthand (padding, margin, border-radius) as numbers rather than a string. Uniform
 * is the common case, so it shows one input until you unlink it; a value the editor can't
 * represent (a keyword, calc(), mixed units) falls back to the raw text field, as does the raw
 * toggle, so nothing becomes uneditable.
 */
export function BoxSetting(props: BoxProps): JSX.Element {
  const parsed = parseBox(props.value);
  const [rawMode, setRawMode] = useState(false);
  const [linked, setLinked] = useState(() => parsed === null || isUniform(parsed));
  const labels = props.corners ? CORNER_LABELS : SIDE_LABELS;

  const write = (box: BoxValue): void => void props.setValue(formatBox(box));

  const setSide = (box: BoxValue, index: number, value: number | undefined): void => {
    const sides = [...box.sides] as BoxSides;
    if (linked) sides.fill(value);
    else sides[index] = value;
    write({ ...box, sides });
  };

  return (
    <ValueSetting {...props}>
      {({ changed, inputRef }) => {
        // Recomputed inside the render callback so the raw fallback and the editor agree on the
        // same value; `parsed` is null exactly when the string is beyond this widget.
        const box = parsed;
        if (box === null || rawMode) {
          return (
            <>
              <input
                className={classNames("textfield", changed && "changed")}
                type="text"
                placeholder={props.placeholder}
                ref={inputRef}
                value={props.value ?? ""}
                onChange={(event) => void props.setValue(event.target.value === "" ? undefined : event.target.value)}
                disabled={props.disabled}
                aria-label={props.title}
              />
              <button
                type="button"
                className={classNames("boxToggle", "active")}
                onClick={() => setRawMode(false)}
                // A value this widget can't represent has nothing to switch back to.
                disabled={props.disabled || box === null}
                title={box === null ? "This value can only be edited as text" : "Back to the box editor"}
                aria-label="Edit as text"
              >
                <Icons.dataObject size={14} />
              </button>
            </>
          );
        }

        return (
          <>
            {(linked ? [0] : [0, 1, 2, 3]).map((index) => (
              <input
                key={index}
                className={classNames("textfield", "boxNumber", changed && "changed")}
                type="number"
                ref={index === 0 ? inputRef : undefined}
                value={box.sides[index] ?? ""}
                placeholder={linked ? props.placeholder : labels[index][0]}
                title={linked ? "All sides" : labels[index]}
                aria-label={linked ? props.title : `${props.title}: ${labels[index]}`}
                onChange={(event) => {
                  const value = event.target.valueAsNumber;
                  setSide(box, index, Number.isNaN(value) ? undefined : value);
                }}
                disabled={props.disabled}
              />
            ))}
            <select
              className="textfield boxUnit"
              value={box.unit}
              onChange={(event) => write({ ...box, unit: event.target.value })}
              disabled={props.disabled}
              aria-label="Unit"
            >
              {BOX_UNITS.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <button
              type="button"
              className={classNames("boxToggle", linked && "active")}
              onClick={() => setLinked((was) => !was)}
              disabled={props.disabled}
              title={linked ? "Edit each side separately" : "Use one value for all sides"}
              aria-label={linked ? "Unlink sides" : "Link sides"}
              aria-pressed={linked}
            >
              <Icons.link size={14} />
            </button>
            <button
              type="button"
              className="boxToggle"
              onClick={() => setRawMode(true)}
              disabled={props.disabled}
              title="Edit as text"
              aria-label="Edit as text"
            >
              <Icons.dataObject size={14} />
            </button>
          </>
        );
      }}
    </ValueSetting>
  );
}
