import { JSX } from "react/jsx-runtime";
import { Toggle } from "../../toggle/Toggle";

import "./settings.less";

export function ToggleSetting({title, subtitle, value, setValue, disabled}: {title: string, subtitle: string, value: boolean, setValue: (value: boolean) => void | Promise<void>, disabled?: boolean}): JSX.Element {

  return (
    <div className="setting field">
      <div className="title">
        <span className="title">{title}</span>
        <span className="subtitle">{subtitle}</span>
      </div>
      <div className="input">
        <Toggle checked={value} setChecked={setValue} disabled={disabled} />
      </div>
    </div>
  );

}