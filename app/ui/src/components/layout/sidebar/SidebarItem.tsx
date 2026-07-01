import { NavLink } from "react-router-dom";
import type { JSX } from "react/jsx-runtime";

import "./sidebar.less";

export default function SidebarItem({ to, icon, label, collapsed, dissapearOnCollapse = false }: { to: string, icon: JSX.Element, label: string, collapsed: boolean, dissapearOnCollapse?: boolean }): JSX.Element {
  return(
    <NavLink
      to={to}
      className={({ isActive, isPending }) =>
        "nav item" + (isPending ? " pending" : isActive ? " active" : "") + (collapsed ? " collapsed" : "") + (dissapearOnCollapse ? " dissapearOnCollapse" : "")
      }

    >
      <span 
        className="icon"
      >
        {icon}
      </span>
      <span 
        className="label"
      >
        {label}
      </span>
    </NavLink>
  );
}
