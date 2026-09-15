import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./alignmentSetting.less";
import { type BaseSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { SettingWidth } from "../settingWidth";
import { classNames } from "../../../common/helpers/classNames";

/** The two axes of a position pair, as a plain shape so this stays free of block types. */
export interface AlignmentValue {
  horizontal: string;
  vertical: string;
}

const HORIZONTAL = ["left", "center", "right"];
const VERTICAL = ["top", "middle", "bottom"];

const LABELS: Record<string, string> = {
  "top left": "Top left", "top center": "Top", "top right": "Top right",
  "middle left": "Left", "middle center": "Centre", "middle right": "Right",
  "bottom left": "Bottom left", "bottom center": "Bottom", "bottom right": "Bottom right",
};

/**
 * A position pair as one nine-cell grid rather than two dropdowns. Alignment is inherently
 * two-dimensional, so a picture of the nine positions is both smaller and easier to read than
 * the axes spelled out separately.
 */
export function AlignmentSetting(props: BaseSettingProps<AlignmentValue>): JSX.Element {
  const { horizontal, vertical } = props.value;
  const saved = props.savedVal;

  return (
    // The grid is taller than the wide layout's single-line input area, so this field stacks.
    <ValueSetting {...props} width={SettingWidth.COMPACT}>
      {() => (
        <div className="alignGrid" role="group" aria-label={props.title}>
          {VERTICAL.map((v) =>
            HORIZONTAL.map((h) => {
              const active = h === horizontal && v === vertical;
              return (
                <button
                  key={`${v} ${h}`}
                  type="button"
                  className={classNames(
                    "alignCell",
                    active && "active",
                    // What saving would replace, matching the button groups' "previous" marker.
                    !active && saved !== undefined && h === saved.horizontal && v === saved.vertical && "previous",
                  )}
                  title={LABELS[`${v} ${h}`]}
                  aria-label={LABELS[`${v} ${h}`]}
                  aria-pressed={active}
                  disabled={props.disabled}
                  onClick={() => void props.setValue({ horizontal: h, vertical: v })}
                >
                  <span className="alignDot" />
                </button>
              );
            }),
          )}
        </div>
      )}
    </ValueSetting>
  );
}
