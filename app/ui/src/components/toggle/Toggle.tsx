import { type JSX } from "react/jsx-runtime";
import "./toggle.less";

export function Toggle({
  checked,
  setChecked,
  disabled,
  ref,
}: {
  checked: boolean;
  setChecked: (value: boolean) => void;
  disabled?: boolean;
  ref?: React.RefObject<HTMLDivElement | null>;
}): JSX.Element {
  return (
    <div
      className={
        "toggle" + (disabled ? " disabled" : "") + (checked ? " checked" : "")
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
