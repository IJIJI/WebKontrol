import { Children } from "react";
import type { JSX } from "react/jsx-runtime";

export default function SidebarSection({children, collapsed, label, dissapearOnCollapse = false}: {children?: JSX.Element[] | JSX.Element, collapsed: boolean, label: string, dissapearOnCollapse?: boolean}): JSX.Element {

  return (
    <div 
      className={
        "nav section" + (collapsed ? " collapsed" : "") + (dissapearOnCollapse ? " dissapearOnCollapse" : "")
      }
      style={{
        fontSize: 10, fontWeight: 500, color: 'var(--color-text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '.08em',
        padding: '10px 14px 4px', whiteSpace: 'nowrap',
        transition: 'opacity .15s',
        opacity: collapsed ? 0 : 1, 
      }}>
      <span>{label}</span>
      <div className="content">
        {children}
      </div>
    </div>
  );
}
