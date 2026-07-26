import { type JSX } from "react/jsx-runtime";

import "./button.less";
import { useState, type ReactNode, type RefObject } from "react";
import { Icons } from "../icons/Icons";


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

// TODO: Add the possiblility for th euser to define loading children
export function Button({
  onClick,
  type = ButtonType.DEFAULT,
  style = ButtonStyle.FILLED,
  children,
  disabled,
  ref,
  size,
  ariaLabel,
  className,
}: {
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
  const [loading, setLoading] = useState(false);
  const isDisabled = disabled || loading;

  // Run the click handler; if it returns a promise, stay in a loading state until it settles.
  // The action is responsible for reporting its own errors (e.g. a toast), so we only swallow
  // the rejection here to keep tracking the pending state cleanly.
  const handleClick = async (): Promise<void> => {
    if (isDisabled) return;
    const result = onClick();
    if (!(result instanceof Promise)) return;
    setLoading(true);
    try {
      await result;
    } catch {
      /* surfaced upstream */
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={"buttonComp " + (className ? `${className} ` : "") + (isDisabled ? "disabled " : "") + type + " " + style}
      disabled={isDisabled}
      onClick={() => void handleClick()}
      ref={ref}
      style={{ fontSize: size }}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading ? <Icons.loading /> : children}
    </button>
  );
}
