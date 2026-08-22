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
  const toggle = (): void => {
    if (!disabled) setChecked(!checked);
  };

  return (
    <div
      className={
        "toggle" + (disabled ? " disabled" : "") + (checked ? " checked" : "") + (className  ? ` ${className}` : "")
      }
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      // A switch must be reachable and usable by keyboard; a disabled one drops out of the
      // tab order entirely, like a disabled native control.
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault(); // Space would scroll the page
        toggle();
      }}
      ref={ref}
    >
      <span className="knob"></span>
    </div>
  );
}
