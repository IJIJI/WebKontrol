import type { JSX } from "react/jsx-runtime";

import "./sidebar.less";
import { Icons } from "../../icons/Icons";

export default function SidebarCollapseButton({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (state: boolean) => void }): JSX.Element {
  return(
    <button
      className={
        "nav item collapse" + (collapsed ? " collapsed" : "")
      }
      onClick={() => setCollapsed(!collapsed)}

    >
      <span 
        className="icon"
      >
        <Icons.chevronLeft />
      </span>
      <span 
        className="label"
      >
        Collapse
      </span>
    </button>
  );
}
