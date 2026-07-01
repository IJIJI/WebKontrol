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
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        position: 'relative',
        whiteSpace: 'nowrap',
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        background: isActive ? 'var(--color-background-secondary)' : 'transparent',
        textDecoration: 'none',
        fontSize: 13,
        userSelect: 'none',
        transition: 'background .1s, color .1s',
      })}
    >
      <span 
        className="icon"
        style={{
          width: 28, height: 28, flexShrink: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: 6,
          // background: isActive ? 'color-mix(in srgb, var(--acc) 12%, transparent)' : 'transparent',
        }}
      >
        {icon}
      </span>
      <span 
        className="label"
        style={{ transition: 'opacity .15s', opacity: collapsed ? 0 : 1 }}
      >
        {label}
      </span>
    </NavLink>
  );
}
