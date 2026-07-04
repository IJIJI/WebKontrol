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
  const inputRef = useRef<HTMLButtonElement>(null);

  return (
    <BaseSetting {...props} inputRef={inputRef}>
      <div className="buttonSelect">
        {props.options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            className={option.value === props.value ? "selected" : ""}
            disabled={props.disabled}
            onClick={() => {
              props.setValue(option.value);
            }}
            ref={index == 0 ? inputRef : undefined}
          >
            {option.label}
          </button>
        ))}
      </div>
    </BaseSetting>
  );
}
