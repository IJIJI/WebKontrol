import { type JSX } from "react/jsx-runtime";
import "./toggle.less";

export function Toggle({
  checked,
  setChecked,
  disabled,
  ref,
  className
}: {
  checked: boolean;
  setChecked: (value: boolean) => void;
  disabled?: boolean;
  ref?: React.RefObject<HTMLDivElement | null>;
  className?: string
}): JSX.Element {
  return (
    <div
      className={
        "toggle" + (disabled ? " disabled" : "") + (checked ? " checked" : "") + (className  ? ` ${className}` : "")
      }
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && setChecked(!checked)}
      ref={ref}
    >
      <span className="knob"></span>
    </div>
  );
}
