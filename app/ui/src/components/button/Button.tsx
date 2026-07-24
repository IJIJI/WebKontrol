import { type JSX } from "react/jsx-runtime";

import "./button.less";
import { type ReactNode, type RefObject } from "react";


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
  children: ReactNode;
  disabled?: boolean;
  ref?: RefObject<HTMLButtonElement | null>;
  size?: number;
  ariaLabel?: string;
  className?: string;
}): JSX.Element {
  const type = props.type ?? ButtonType.DEFAULT;
  const style = props.style ?? ButtonStyle.FILLED;

  return (
    <button
      type="button"
      className={"buttonComp " + (props.className ? `${props.className} ` : "") + (props.disabled ? "disabled " : "") + type + " " + style}
      disabled={props.disabled}
      onClick={() => {
        if (!props.disabled) props.onClick();
      }}
      ref={props.ref}
      style={{ fontSize: props.size }}
      aria-label={props.ariaLabel}
    >
      {props.children}
    </button>
  );
}
