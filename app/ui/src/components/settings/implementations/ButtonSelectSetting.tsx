import { type JSX } from "react/jsx-runtime";

import "../settings.less";

import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { useRef } from "react";

type ButtonSelectProps<OptionT> = BaseSettingProps<OptionT> & {
  options: { label: string; value: OptionT }[];
};

export function ButtonSelectSetting<T>(
  props: ButtonSelectProps<T>,
): JSX.Element {

  return (
    <BaseSetting {...props} >
      <div className="buttonSelect">
        {props.options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            className={option.value === props.value ? "active" : ""}
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
