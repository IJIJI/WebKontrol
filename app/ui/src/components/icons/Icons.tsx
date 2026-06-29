import { JSX } from "react/jsx-runtime";

type IconProps = { size?: number; className?: string; style?: React.CSSProperties };
type Icon = (props: IconProps) => JSX.Element;

const icon = (viewBox: string, children: JSX.Element): Icon =>
  ({ size = 16, ...p }) => (
    <svg width={size} height={size} viewBox={viewBox} fill="none" {...p}>
      {children}
    </svg>
  );

export const Icons = { 
  warning: icon("0 0 13 13", 
    <>
      <path d="M6.5 1L12 11.5H1L6.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <line x1="6.5" y1="5" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="6.5" cy="9.8" r=".6" fill="currentColor"/>
    </>
  ),
  connections: icon("0 0 16 16", 
    <>
      <circle cx="4"  cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="6" y1="7.2" x2="10" y2="5"  stroke="currentColor" strokeWidth="1.2"/>
      <line x1="6" y1="8.8" x2="10" y2="11" stroke="currentColor" strokeWidth="1.2"/>
    </>
  ),
} satisfies Record<string, Icon>