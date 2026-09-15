import type { JSX } from "react/jsx-runtime";

import "./sidebar.less";
import { Icons } from "../../icons/Icons";

export default function SidebarLoader({
  label,
  collapsed,
  dissapearOnCollapse = true,
}: {
  label?: string;
  collapsed: boolean;
  dissapearOnCollapse?: boolean;
}): JSX.Element {
  return (
    <div
      className={
        "nav item" +
        (collapsed ? " collapsed" : "") +
        (dissapearOnCollapse ? " dissapearOnCollapse" : "")
      }
    >
      <span className="icon"><Icons.loading /></span>
      <span className="label">{label ?? "Loading..."}</span>
    </div>
  );
}
