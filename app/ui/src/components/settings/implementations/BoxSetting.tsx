import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./boxSetting.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { SettingWidth } from "../settingWidth";
import { Icons } from "../../icons/Icons";
import { classNames } from "../../../common/helpers/classNames";
import {
  BOX_UNITS,
  boxMode,
  formatBox,
  parseBox,
  slotCount,
  slotTargets,
  type BoxMode,
  type BoxSides,
  type BoxValue,
} from "./cssBox";

// What each input covers, per mode. The pair labels differ by geometry: for sides the CSS
// two-value form pairs opposite *edges*, for corners it pairs opposite *corners* (diagonals).
const CAPTIONS: Record<BoxMode, { sides: string[]; corners: string[] }> = {
  all: { sides: ["All"], corners: ["All"] },
  pair: { sides: ["Vertical", "Horizontal"], corners: ["TL / BR", "TR / BL"] },
  each: { sides: ["Top", "Right", "Bottom", "Left"], corners: ["Top left", "Top right", "Bottom right", "Bottom left"] },
};

const MODE_LABELS: { mode: BoxMode; label: string; hint: string }[] = [
  { mode: "all", label: "All", hint: "One value for every side" },
  { mode: "pair", label: "Pair", hint: "One value per opposite pair" },
  { mode: "each", label: "Each", hint: "Each side on its own" },
];

type BoxProps = InputSettingProps<string | undefined> & {
  /** Border-radius addresses corners rather than sides; only the labels differ. */
  corners?: boolean;
};

/**
 * A CSS box shorthand (padding, margin, border-radius) as numbers rather than a string. The
 * three link modes are CSS's own 1-, 2- and 4-value forms, so the inputs on screen always match
 * what is stored. A value the editor can't represent (a keyword, calc(), mixed units) falls back
 * to the raw text field, as does the raw toggle, so nothing becomes uneditable.
 */
export function BoxSetting(props: BoxProps): JSX.Element {
  const parsed = parseBox(props.value);
  const [rawMode, setRawMode] = useState(false);
  // Seeded from the value, then held: deriving it every render would snap the inputs together
  // the moment two sides happened to match while typing.
  const [mode, setMode] = useState<BoxMode>(() => (parsed === null ? "all" : boxMode(parsed)));
  const captions = CAPTIONS[mode][props.corners ? "corners" : "sides"];

  const write = (box: BoxValue): void => void props.setValue(formatBox(box));

  const setSlot = (box: BoxValue, slot: number, value: number | undefined): void => {
    const sides = [...box.sides] as BoxSides;
    for (const target of slotTargets(mode, slot)) sides[target] = value;
    write({ ...box, sides });
  };

  // Narrowing the mode drops the positions it can no longer express; widening keeps what is
  // there, since the shorthand already expanded them.
  const changeMode = (box: BoxValue, next: BoxMode): void => {
    setMode(next);
    const sides = [...box.sides] as BoxSides;
    for (let slot = 0; slot < slotCount(next); slot++) {
      for (const target of slotTargets(next, slot)) sides[target] = box.sides[slot];
    }
    write({ ...box, sides });
  };

  return (
    // Two rows of controls plus captions; the wide layout pins the input area to one field
    // height, so this field always stacks (as the textarea does).
    <ValueSetting {...props} width={SettingWidth.COMPACT}>
      {({ changed, inputRef }) => {
        const box = parsed;
        if (box === null || rawMode) {
          return (
            <div className="boxEditor">
              <div className="boxHead">
                <span className="boxHint">
                  {box === null ? "Only editable as text" : "Editing as text"}
                </span>
                <button
                  type="button"
                  className="boxToggle active"
                  onClick={() => setRawMode(false)}
                  // A value this widget can't represent has nothing to switch back to.
                  disabled={props.disabled || box === null}
                  title={box === null ? "This value can only be edited as text" : "Back to the box editor"}
                  aria-label="Edit as text"
                >
                  <Icons.dataObject size={14} />
                </button>
              </div>
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
            </div>
          );
        }

        return (
          <div className="boxEditor">
            <div className="boxHead">
              <div className="buttonSelect" role="group" aria-label="Unit">
                {BOX_UNITS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className={box.unit === unit ? "active" : ""}
                    onClick={() => write({ ...box, unit })}
                    disabled={props.disabled}
                    aria-pressed={box.unit === unit}
                  >
                    {unit}
                  </button>
                ))}
              </div>
              <div className="buttonSelect" role="group" aria-label="Link sides">
                {MODE_LABELS.map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    className={mode === option.mode ? "active" : ""}
                    onClick={() => changeMode(box, option.mode)}
                    disabled={props.disabled}
                    title={option.hint}
                    aria-pressed={mode === option.mode}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
            </div>

            <div className="boxSides">
              {captions.map((caption, slot) => (
                <label className="boxSide" key={caption}>
                  <input
                    className={classNames("textfield", changed && "changed")}
                    type="number"
                    // No inputRef here: the row focuses its registered input on any click in the
                    // row, so registering one of several would drag focus off whichever box was
                    // actually clicked. Same reasoning as DisplayNameSetting.
                    value={box.sides[slotTargets(mode, slot)[0]] ?? ""}
                    placeholder={props.placeholder}
                    aria-label={`${props.title}: ${caption}`}
                    onChange={(event) => {
                      const value = event.target.valueAsNumber;
                      setSlot(box, slot, Number.isNaN(value) ? undefined : value);
                    }}
                    disabled={props.disabled}
                  />
                  <span className="boxCaption">{caption}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }}
    </ValueSetting>
  );
}
