import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { RestoreButton } from "../RestoreButton";
import { classNames } from "../../../common/helpers/classNames";

type SelectProps<T extends string> = BaseSettingProps<T> & {
  options: { label: string; value: T }[];
};

// A dropdown select. Preferred over ButtonSelectSetting when there are many options
// (e.g. long enums). Value type is constrained to string since <option> values are strings.
export function SelectSetting<T extends string>(props: SelectProps<T>): JSX.Element {
  const changed = props.savedVal !== undefined && props.savedVal !== props.value;
  const restore = (): void => {
    if (props.savedVal === undefined) return;
    props.setValue(props.savedVal);
  };

  return (
    <BaseSetting {...props} changed={changed}>
      {changed ? <RestoreButton onClick={restore} /> : <></>}
      <select
        className={classNames("textfield", changed && "changed")}
        value={props.value}
        onChange={(event) => {
          props.setValue(event.target.value as T);
        }}
        disabled={props.disabled}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </BaseSetting>
  );
}
