import type { JSX } from "react/jsx-runtime";

import "./sidebar.less";

export default function SidebarSection({
  children,
  collapsed,
  label,
  dissapearOnCollapse = false,
}: {
  children?: JSX.Element[] | JSX.Element;
  collapsed: boolean;
  label: string;
  dissapearOnCollapse?: boolean;
}): JSX.Element {
  return (
    <div
      className={
        "nav section" +
        (collapsed ? " collapsed" : "") +
        (dissapearOnCollapse ? " dissapearOnCollapse" : "")
      }
    >
      <span className="section label">{label}</span>
      <div className="section content">{children}</div>
    </div>
  );
}
