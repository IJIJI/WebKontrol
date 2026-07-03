import { JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, BaseSettingNonValProps, BaseSettingProps } from "../BaseSetting";
import { useRef } from "react";

type ButtonSettingProps = BaseSettingNonValProps & {
  onClick: () => void | Promise<void>,
  type?: ButtonSettingType,
  label: string
};

export enum ButtonSettingType {
  DEFAULT = "default",
  ACCENT = "accent",
  SUCCESS = "success",
  DANGER = "danger",
  WARNING = "warning",
  INFO = "info",
}

export function ButtonSetting(props: ButtonSettingProps): JSX.Element {
  if (!props.type)
    props.type = ButtonSettingType.DEFAULT;

  const inputRef = useRef<HTMLButtonElement>(null);

  return (
    <BaseSetting {...props} inputRef={inputRef}>
        <button
          type="button"
          className={props.type}
          disabled={props.disabled}
          onClick={() => !props.disabled && props.onClick()}
          ref={inputRef}
        >
          {props.label}
        </button>
    </BaseSetting>
  );
}

