import { type JSX } from "react/jsx-runtime";

import "./settings.less";
import { classNames } from "../../common/helpers/classNames";

// `joined` renders the group's rows as one card with dividers (like the read-only DetailList)
// instead of an island per field — for dense contexts like the block editor pane.
export function SettingGroup({
  children,
  title,
  joined,
}: {
  children: JSX.Element | JSX.Element[];
  title: string;
  joined?: boolean;
}): JSX.Element {
  return (
    <div className={classNames("setting", "group", joined && "joined")}>
      <span className="label">{title}</span>
      <div className="content">{children}</div>
    </div>
  );
}
