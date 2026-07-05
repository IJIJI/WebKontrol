import { type JSX } from "react/jsx-runtime";

import "./button.less";
import { RefObject, useRef } from "react";


export enum ButtonSettingType {
  DEFAULT = "default",
  ACCENT = "accent",
  SUCCESS = "success",
  DANGER = "danger",
  WARNING = "warning",
  INFO = "info",
}

export enum ButtonSettingStyle {
  FILLED = "filled",
  SKELETON = "skeleton",
}

export function Button(props: {
  onClick: () => void | Promise<void>;
  type?: ButtonSettingType;
  style?: ButtonSettingStyle;
  label: string;
  disabled: boolean;
  ref: RefObject<HTMLButtonElement>;
}): JSX.Element {
  const type = props.type ?? ButtonSettingType.DEFAULT;
  const style = props.style ?? ButtonSettingStyle.FILLED;

  return (
    <button
      type="button"
      className={"buttonComp " + type + " " + style}
      disabled={props.disabled}
      onClick={() => {
        !props.disabled && props.onClick();
      }}
      ref={props.ref}
    >
      {props.label}
    </button>
  );
}
