import { type JSX } from "react/jsx-runtime";

import "./button.less";
import { RefObject, useRef } from "react";


export enum ButtonType {
  DEFAULT = "default",
  ACCENT = "accent",
  SUCCESS = "success",
  DANGER = "danger",
  WARNING = "warning",
  INFO = "info",
}

export enum ButtonStyle {
  FILLED = "filled",
  SKELETON = "skeleton",
}

export function Button(props: {
  onClick: () => void | Promise<void>;
  type?: ButtonType;
  style?: ButtonStyle;
  label: string;
  disabled?: boolean;
  ref?: RefObject<HTMLButtonElement>;
}): JSX.Element {
  const type = props.type ?? ButtonType.DEFAULT;
  const style = props.style ?? ButtonStyle.FILLED;

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
