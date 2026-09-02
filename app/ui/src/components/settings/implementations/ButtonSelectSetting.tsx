import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { type BaseSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { classNames } from "../../../common/helpers/classNames";

type ButtonSelectProps<OptionT> = BaseSettingProps<OptionT> & {
  options: { label: string; value: OptionT }[];
  // TODO: Add ButtonSettingType per button?
};

// No inputRef: the options are their own buttons, so there is nothing for a row click to focus.
export function ButtonSelectSetting<T>(props: ButtonSelectProps<T>): JSX.Element {
  return (
    <ValueSetting {...props}>
      {() => (
        <div className="buttonSelect">
          {props.options.map((option) => (
            <button
              key={option.label}
              type="button"
              className={classNames(
                option.value === props.value && "active",
                // Only worth marking while it isn't the current pick, as a hint at what saving
                // would replace.
                option.value !== props.value && option.value === props.savedVal && "previous",
              )}
              disabled={props.disabled}
              aria-pressed={option.value === props.value}
              onClick={() => void props.setValue(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </ValueSetting>
  );
}
