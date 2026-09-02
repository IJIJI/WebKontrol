import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { type BaseSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { classNames } from "../../../common/helpers/classNames";

type SelectProps<T extends string> = BaseSettingProps<T> & {
  options: { label: string; value: T }[];
};

// A dropdown select. Preferred over ButtonSelectSetting when there are many options
// (e.g. long enums). Value type is constrained to string since <option> values are strings.
export function SelectSetting<T extends string>(props: SelectProps<T>): JSX.Element {
  return (
    <ValueSetting<T, HTMLSelectElement> {...props}>
      {({ changed, inputRef }) => (
        <select
          ref={inputRef}
          className={classNames("textfield", changed && "changed")}
          value={props.value}
          onChange={(event) => void props.setValue(event.target.value as T)}
          disabled={props.disabled}
        >
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </ValueSetting>
  );
}
