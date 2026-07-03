import { JSX } from "react/jsx-runtime";

import "../settings.less";

export function ButtonSelectSetting<T,>({title, subtitle, value, setValue, disabled, options}: {title: string, subtitle: string, value: T, setValue: (value: T) => void | Promise<void>, disabled?: boolean, options: {label: string, value: T}[]}): JSX.Element {

  return (
    <div className="setting field">
      <div className="title">
        <span className="title">{title}</span>
        <span className="subtitle">{subtitle}</span>
      </div>
      <div className="input">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            className={option.value === value ? "selected" : ""}
            disabled={disabled}
            onClick={() => setValue(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

}