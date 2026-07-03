import { JSX } from "react/jsx-runtime";

import "../settings.less";

export enum ButtonSettingType {
  DEFAULT = "default",
  ACCENT = "accent",
  SUCCESS = "success",
  DANGER = "danger",
  WARNING = "warning",
  INFO = "info",
}

export function ButtonSetting<T,>({title, subtitle, onClick, disabled, type, label}: {title: string, subtitle: string, onClick: () => void | Promise<void>, disabled?: boolean, type: ButtonSettingType, label: string}): JSX.Element {
  if (!type)
    type = ButtonSettingType.DEFAULT;

  return (
    <div className="setting field">
      <div className="title">
        <span className="title">{title}</span>
        <span className="subtitle">{subtitle}</span>
      </div>
      <div className="input">
        <button
          type="button"
          className={type}
          disabled={disabled}
          onClick={() => !disabled && onClick()}
        >
          {label}
        </button>
      </div>
    </div>
  );

}