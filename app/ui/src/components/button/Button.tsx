import { type JSX } from "react/jsx-runtime";

import "./button.less";
import { type RefObject } from "react";


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
  children: string | JSX.Element | JSX.Element[];
  disabled?: boolean;
  ref?: RefObject<HTMLButtonElement | null>;
  size?: number;
}): JSX.Element {
  const type = props.type ?? ButtonType.DEFAULT;
  const style = props.style ?? ButtonStyle.FILLED;

  return (
    <button
      type="button"
      className={"buttonComp " + (props.disabled ? "disabled " : "") + type + " " + style}
      disabled={props.disabled}
      onClick={() => {
        if (!props.disabled) props.onClick();
      }}
      ref={props.ref}
      style={{ fontSize: props.size }}
    >
      {props.children}
    </button>
  );
}
