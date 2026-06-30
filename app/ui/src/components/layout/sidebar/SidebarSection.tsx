import type { JSX } from "react/jsx-runtime";

export default function SidebarSection({collapsed, label}: {collapsed: boolean, label: string}): JSX.Element {

  return (
    <div style={{
        fontSize: 10, fontWeight: 500, color: 'var(--color-text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '.08em',
        padding: '10px 14px 4px', whiteSpace: 'nowrap',
        opacity: collapsed ? 0 : 1, transition: 'opacity .15s',
      }}>
      <span>{label}</span>
    </div>
  );
}
