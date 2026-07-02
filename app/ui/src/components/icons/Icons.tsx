import type { JSX } from "react/jsx-runtime";

type IconProps = { size?: number; className?: string; style?: React.CSSProperties };
type Icon = (props: IconProps) => JSX.Element;

const icon = (viewBox: string, children: JSX.Element, fill: boolean = false): Icon =>
  ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox={viewBox} fill={fill ? "currentColor" : "none"} {...p}>
      {children}
    </svg>
  );

export const Icons = { //TODO: Add more icons or use a standard library.
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
  settings: icon("0 0 16 16", // TODO Fix
    <>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </>
  ),
  source: icon("0 0 16 16",
    <>
      <circle cx="8" cy="8" r="2.5" fill="white"/>
      <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none" opacity=".6"/>
      <circle cx="8" cy="8" r="7.5" stroke="white" strokeWidth=".8" fill="none" opacity=".3"/>
    </>
  ),
  grid: icon("0 0 16 16",
    <>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="9"   y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1.5" y="9"   width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="9"   y="9"   width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
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
  burger: icon("0 0 15 15",
    <>
      <rect y="2"  width="15" height="1.5" rx=".75" fill="currentColor"/>
      <rect y="7"  width="15" height="1.5" rx=".75" fill="currentColor"/>
      <rect y="12" width="15" height="1.5" rx=".75" fill="currentColor"/>
    </>
  ),
  chevronLeft: icon("0 0 13 13",
    <>
      <path d="M8 2L4 6.5L8 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  chevronRight: icon("0 0 13 13",
    <>
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  home: icon("0 -960 960 960", // From material design
    <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z"/>
  , true),
  homeAndGarden: icon("0 -960 960 960", // From material design
    <path d="M160-160v-375l-72 55-47-63 440-337 439 337-16 21q-45-31-99-37t-105 14q-60-23-123.5-10.5T465-495q-48 48-60.5 111.5T415-260q-10 24-13 49t-1 51H160Zm540 95q-42 29-92.5 24.5T521-81q-36-36-40.5-86.5T505-260q-29-42-24.5-92.5T521-439q36-36 86.5-40.5T700-455q42-29 92.5-24.5T879-439q36 36 40.5 86.5T895-260q29 42 24.5 92.5T879-81q-36 36-86.5 40.5T700-65Zm35.5-159.5Q750-239 750-260t-14.5-35.5Q721-310 700-310t-35.5 14.5Q650-281 650-260t14.5 35.5Q679-210 700-210t35.5-14.5Z"/>
  , true),
  screen: icon("0 -960 960 960", // From material design
    <path d="M240-120v-80l40-40H160q-33 0-56.5-23.5T80-320v-440q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v440q0 33-23.5 56.5T800-240H680l40 40v80H240Z"/>
  , true),
  tab: icon("0 -960 960 960", // From material design
    <path d="M160-240h640v-320H520v-160H160v480Zm0 80q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80v-480 480Z"/>
  , true),
} satisfies Record<string, Icon>
