import { type JSX } from "react/jsx-runtime";

import "./settings.less";

export function SettingGroup({children, title}: {children: JSX.Element | JSX.Element[], title: string}): JSX.Element {

  return (
    <div className="setting group">
      <span className="label">{title}</span>
      <div className="content">
        {children}
      </div>
    </div>
  );
}