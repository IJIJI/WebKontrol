import { type JSX } from "react/jsx-runtime";

import "../settings.less";

import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { RestoreButton } from "../RestoreButton";

type ButtonSelectProps<OptionT> = BaseSettingProps<OptionT> & {
  options: { label: string; value: OptionT }[];
  // TODO: Add ButtonSettingType per button?
};

export function ButtonSelectSetting<T>(
  props: ButtonSelectProps<T>,
): JSX.Element {

  const changed = props.savedVal !== undefined && props.savedVal !== props.value;
  const restore = (): void => {
    if (props.savedVal === undefined) return;
    props.setValue(props.savedVal);
  };

  return (
    <BaseSetting {...props} changed={changed} >
      {changed ? <RestoreButton onClick={restore} /> : <></>}
      <div className="buttonSelect">
        {props.options.map((option) => (
          <button
            key={option.label}
            type="button"
            className={option.value === props.value ? "active" : "" + option.value === props.savedVal ? " previous" : ""}
            disabled={props.disabled}
            onClick={() => {
              props.setValue(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </BaseSetting>
  );
}
