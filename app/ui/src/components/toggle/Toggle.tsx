import { JSX } from 'react/jsx-runtime';
import './toggle.less';

export function Toggle({checked, setChecked, disabled}: {checked: boolean, setChecked: (value: boolean) => void, disabled?: boolean}): JSX.Element {
  return (
    <div 
      className={"toggle"+(disabled ? " disabled" : "")+(checked ? " checked" : "")}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && setChecked(!checked)}
    >
      <span className="knob"></span>
    </div>
  );
}