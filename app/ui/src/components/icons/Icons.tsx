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
  check: icon("0 0 16 16",
    <>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4.5 8L7 10.5L11.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  alert: icon("0 0 16 16",
    <>
      <path d="M8,1 L9.9,3.4 L12.95,3.05 L12.6,6.1 L15,8 L12.6,9.9 L12.95,12.95 L9.9,12.6 L8,15 L6.1,12.6 L3.05,12.95 L3.4,9.9 L1,8 L3.4,6.1 L3.05,3.05 L6.1,3.4 Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <line x1="8" y1="5" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="8" cy="11.2" r=".65" fill="currentColor"/>
    </>
  ),
  loading: icon("0 0 16 16",
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28 13" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.75s" repeatCount="indefinite"/>
    </circle>
  ),
} satisfies Record<string, Icon>