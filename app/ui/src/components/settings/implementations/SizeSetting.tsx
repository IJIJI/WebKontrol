import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./sizeSetting.less";
import { type BaseSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { SettingWidth } from "../settingWidth";
import { classNames } from "../../../common/helpers/classNames";
import { formatSize, parseSize, SIZE_KEYWORDS, SIZE_UNITS, type SizeUnit } from "./cssSize";

/** The two axes, as a plain shape so this stays free of block types. */
export interface SizeAxesValue {
  x?: string;
  y?: string;
}

const AXES: { key: keyof SizeAxesValue; caption: string }[] = [
  { key: "x", caption: "Width" },
  { key: "y", caption: "Height" },
];

type SizeProps = BaseSettingProps<SizeAxesValue> & {
  /** Bounds take lengths only: "hug your content" is not a minimum anyone can act on. */
  lengthsOnly?: boolean;
};

/**
 * Both axes of a block's size in one control: a keyword or a measurement per axis, following
 * the box editor's number-plus-unit shape so sizes and spacings read the same way. The axes are
 * independent by nature, so there is no link mode and no four-value form.
 *
 * An assist over the stored string, never a replacement: anything it cannot represent
 * (`calc()`, `fit-content`) falls back to a raw text field for that axis, so no CSS becomes
 * unreachable through the editor.
 */
export function SizeSetting(props: SizeProps): JSX.Element {
  const keywords = props.lengthsOnly ? [] : SIZE_KEYWORDS;

  const setAxis = (axis: keyof SizeAxesValue, raw: string | undefined): void =>
    void props.setValue({ ...props.value, [axis]: raw });

  return (
    // Two captioned rows are taller than the wide layout's single input line, so this stacks.
    <ValueSetting {...props} width={SettingWidth.COMPACT}>
      {() => (
        <div className="sizeAxes" role="group" aria-label={props.title}>
          {AXES.map(({ key, caption }) => {
            const stored = props.value[key];
            const parsed = parseSize(stored);
            const changed = stored !== props.savedVal?.[key];

            return (
              <div className="sizeAxis" key={key}>
                <div className="sizeControls">
                  {parsed === null ? (
                    // Unrepresentable: hand the axis back as raw text rather than rewriting it.
                    <input
                      id={`size-${key}`}
                      className={classNames("textfield", changed && "changed")}
                      type="text"
                      value={stored ?? ""}
                      disabled={props.disabled}
                      aria-label={caption}
                      onChange={(event) => setAxis(key, event.target.value || undefined)}
                    />
                  ) : (
                    <>
                      <input
                        id={`size-${key}`}
                        className={classNames("textfield", changed && "changed")}
                        type="number"
                        value={parsed.value ?? ""}
                        placeholder={parsed.keyword ? "" : "auto"}
                        // A keyword has no number to edit; the select is where it changes back.
                        disabled={props.disabled || parsed.keyword !== undefined}
                        aria-label={caption}
                        onChange={(event) =>
                          setAxis(key, formatSize({
                            ...parsed,
                            keyword: undefined,
                            value: event.target.value === "" ? undefined : event.target.valueAsNumber,
                          }))
                        }
                      />
                      <select
                        className={classNames("textfield", changed && "changed")}
                        value={parsed.keyword ?? parsed.unit}
                        disabled={props.disabled}
                        aria-label={`${caption} unit`}
                        onChange={(event) => {
                          const next = event.target.value;
                          setAxis(key, SIZE_KEYWORDS.some((word) => word === next)
                            ? next
                            // Switching off a keyword leaves the number blank, i.e. back to the
                            // block's default, rather than inventing a measurement.
                            : formatSize({ value: parsed.value, unit: next as SizeUnit }));
                        }}
                      >
                        {keywords.map((word) => (
                          <option key={word} value={word}>{word}</option>
                        ))}
                        {SIZE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
                <label className="sizeCaption" htmlFor={`size-${key}`}>{caption}</label>
              </div>
            );
          })}
        </div>
      )}
    </ValueSetting>
  );
}
