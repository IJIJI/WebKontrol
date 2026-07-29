import type { JSX } from "react/jsx-runtime";

type IconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};
type Icon = (props: IconProps) => JSX.Element;

const icon =
  (viewBox: string, children: JSX.Element, fill: boolean = false): Icon =>
  ({ size = 20, ...p }) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill ? "currentColor" : "none"}
      {...p}
    >
      {children}
    </svg>
  );

export const Icons = {
  //TODO: Add more icons or use a standard library.
  warning: icon(
    "0 0 13 13",
    <>
      <path
        d="M6.5 1L12 11.5H1L6.5 1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <line
        x1="6.5"
        y1="5"
        x2="6.5"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="6.5" cy="9.8" r=".6" fill="currentColor" />
    </>,
  ),
  share: icon(
    "0 0 16 16",
    <>
      <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.3" />
      <line
        x1="6"
        y1="7.2"
        x2="10"
        y2="5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="6"
        y1="8.8"
        x2="10"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </>,
  ),
  sun: icon(
    "0 0 16 16", // TODO Fix
    <>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>,
  ),
  source: icon(
    "0 0 16 16",
    <>
      <circle cx="8" cy="8" r="2.5" fill="white" />
      <circle
        cx="8"
        cy="8"
        r="5.5"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
        opacity=".6"
      />
      <circle
        cx="8"
        cy="8"
        r="7.5"
        stroke="white"
        strokeWidth=".8"
        fill="none"
        opacity=".3"
      />
    </>,
  ),
  grid: icon(
    "0 0 16 16",
    <>
      <rect
        x="1.5"
        y="1.5"
        width="5.5"
        height="5.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="9"
        y="1.5"
        width="5.5"
        height="5.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="1.5"
        y="9"
        width="5.5"
        height="5.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="9"
        y="9"
        width="5.5"
        height="5.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </>,
  ),
  check: icon(
    "0 0 13 13",
    <>
      <path d="M2 6.5L5 9.5L11 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>,
  ),
  checkCircle: icon(
    "0 0 16 16",
    <>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M4.5 8L7 10.5L11.5 5.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  alert: icon(
    "0 0 16 16",
    <>
      <path
        d="M8,1 L9.9,3.4 L12.95,3.05 L12.6,6.1 L15,8 L12.6,9.9 L12.95,12.95 L9.9,12.6 L8,15 L6.1,12.6 L3.05,12.95 L3.4,9.9 L1,8 L3.4,6.1 L3.05,3.05 L6.1,3.4 Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <line
        x1="8"
        y1="5"
        x2="8"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.2" r=".65" fill="currentColor" />
    </>,
  ),
  loading: icon(
    "0 0 16 16",
    <circle
      cx="8"
      cy="8"
      r="6.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="28 13"
      strokeLinecap="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 8 8"
        to="360 8 8"
        dur="1.0s"
        repeatCount="indefinite"
      />
    </circle>,
  ),
  burger: icon(
    "0 0 15 15",
    <>
      <rect y="2" width="15" height="1.5" rx=".75" fill="currentColor" />
      <rect y="7" width="15" height="1.5" rx=".75" fill="currentColor" />
      <rect y="12" width="15" height="1.5" rx=".75" fill="currentColor" />
    </>,
  ),
  chevronLeft: icon(
    "0 0 13 13",
    <>
      <path
        d="M8 2L4 6.5L8 11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  chevronRight: icon(
    "0 0 13 13",
    <>
      <path
        d="M4 2l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  home: icon(
    "0 -960 960 960", // From material design
    <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />,
    true,
  ),
  homeAndGarden: icon(
    "0 -960 960 960", // From material design
    <path d="M160-160v-375l-72 55-47-63 440-337 439 337-16 21q-45-31-99-37t-105 14q-60-23-123.5-10.5T465-495q-48 48-60.5 111.5T415-260q-10 24-13 49t-1 51H160Zm540 95q-42 29-92.5 24.5T521-81q-36-36-40.5-86.5T505-260q-29-42-24.5-92.5T521-439q36-36 86.5-40.5T700-455q42-29 92.5-24.5T879-439q36 36 40.5 86.5T895-260q29 42 24.5 92.5T879-81q-36 36-86.5 40.5T700-65Zm35.5-159.5Q750-239 750-260t-14.5-35.5Q721-310 700-310t-35.5 14.5Q650-281 650-260t14.5 35.5Q679-210 700-210t35.5-14.5Z" />,
    true,
  ),
  screen: icon(
    "0 -960 960 960", // From material design
    <path d="M240-120v-80l40-40H160q-33 0-56.5-23.5T80-320v-440q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v440q0 33-23.5 56.5T800-240H680l40 40v80H240Z" />,
    true,
  ),
  tab: icon(
    "0 -960 960 960", // From material design
    <path d="M160-240h640v-320H520v-160H160v480Zm0 80q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80v-480 480Z" />,
    true,
  ),
  close: icon(
    "0 -960 960 960", // From material design
    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />,
    true,
  ),
  cancel: icon(
    "0 -960 960 960", // From material design
    <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />,
    true,
  ),
  arrowForward: icon(
    "0 -960 960 960", // From material design
    <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />,
    true,
  ),
  arrowBackward: icon(
    "0 -960 960 960", // From material design
    <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />,
    true,
  ),
  favorite: icon(
    "0 -960 960 960", // From material design
    <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z" />,
    true,
  ),
  refresh: icon(
    "0 -960 960 960", // From material design
    <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/>,
    true,
  ),
  undo: icon(
    "0 -960 960 960", // From material design
    <path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/>,
    true,
  ),
  redo: icon(
    "0 -960 960 960", // From material design
    <path d="M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z"/>,
    true,
  ),
  plus: icon(
    "0 -960 960 960", // From material design
    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>,
    true,
  ),
  min: icon(
    "0 -960 960 960", // From material design
    <path d="M240-120v-80h480v80H240Z"/>,
    true,
  ),
  add: icon(
    "0 -960 960 960", // From material design
    <path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>,
    true,
  ),
  addWindow: icon(
    "0 -960 960 960", // From material design
    <path d="M720-160v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-600 40q-33 0-56.5-23.5T40-200v-560q0-33 23.5-56.5T120-840h560q33 0 56.5 23.5T760-760v200h-80v-80H120v440h520v80H120Z"/>,
    true,
  ),
  settings: icon(
    "0 -960 960 960", // From material design
    <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Z"/>,
    true,
  ),
  cogs: icon(
    "0 -960 960 960", // From material design
    <path d="m234-480-12-60q-12-5-22.5-10.5T178-564l-58 18-40-68 46-40q-2-13-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T222-820l12-60h80l12 60q12 5 22.5 10.5T370-796l58-18 40 68-46 40q2 13 2 26t-2 26l46 40-40 68-58-18q-11 8-21.5 13.5T326-540l-12 60h-80Zm96.5-143.5Q354-647 354-680t-23.5-56.5Q307-760 274-760t-56.5 23.5Q194-713 194-680t23.5 56.5Q241-600 274-600t56.5-23.5ZM592-40l-18-84q-17-6-31.5-14.5T514-158l-80 26-56-96 64-56q-2-18-2-36t2-36l-64-56 56-96 80 26q14-11 28.5-19.5T574-516l18-84h112l18 84q17 6 31.5 14.5T782-482l80-26 56 96-64 56q2 18 2 36t-2 36l64 56-56 96-80-26q-14 11-28.5 19.5T722-124l-18 84H592Zm56-160q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z"/>,
    true,
  ),
  openInNew: icon(
    "0 -960 960 960", // From material design
    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/>,
    true,
  ),
  installDesktop: icon(
    "0 -960 960 960", // From material design
    <path d="M320-120v-80H160q-33 0-56.5-23.5T80-280v-480q0-33 23.5-56.5T160-840h320v80H160v480h640v-120h80v120q0 33-23.5 56.5T800-200H640v80H320Zm360-280L480-600l56-56 104 103v-287h80v287l104-103 56 56-200 200Z"/>,
    true,
  ),
  selectWindow: icon(
    "0 -960 960 960", // From material design
    <path d="M160-80q-33 0-56.5-23.5T80-160v-360q0-33 23.5-56.5T160-600h80v-200q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v360q0 33-23.5 56.5T800-360h-80v200q0 33-23.5 56.5T640-80H160Zm0-80h480v-280H160v280Zm560-280h80v-280H320v120h320q33 0 56.5 23.5T720-520v80Z"/>,
    true,
  ),
  tabDuplicate: icon(
    "0 -960 960 960", // From material design
    <path d="M320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320ZM240-80v-80h80v80h-80Zm-80-640H80q0-33 23.5-56.5T160-800v80ZM400-80v-80h80v80h-80Zm160 0v-80h80v80h-80Zm-400-80v80q-33 0-56.5-23.5T80-160h80Zm-80-80v-80h80v80H80Zm0-160v-80h80v80H80Zm0-160v-80h80v80H80Zm640 400h80q0 33-23.5 56.5T720-80v-80ZM520-640h280v-160H520v160Z"/>,
    true,
  ),
  addToWindow: icon(
    "0 -960 960 960", // From material design
    <path d="M440-360h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM320-120v-80H160q-33 0-56.5-23.5T80-280v-480q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v480q0 33-23.5 56.5T800-200H640v80H320Z"/>,
    true,
  ),
  importantDevices: icon(
    "0 -960 960 960", // From material design
    <path d="M680-120q-17 0-28.5-11.5T640-160v-318q0-17 11.5-28.5T680-518h160q17 0 28.5 11.5T880-478v318q0 17-11.5 28.5T840-120H680Zm0-80h160v-238H680v238ZM348-410l92-70 92 70-34-114 92-74H476l-36-112-36 112H290l92 74-34 114Zm-28 290v-80h80v-80H160q-33 0-56.5-23.5T80-360v-400q0-33 23.5-56.5T160-840h560q33 0 56.5 23.5T800-760v162H680q-50 0-85 35t-35 85v198h-80v80h80v80H320Z"/>,
    true,
  ),
  more: icon(
    "0 -960 960 960", // From material design
    <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/>,
    true,
  ),
  edit: icon(
    "0 -960 960 960", // From material design
    <path d="M120-120v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm584-528 56-56-56-56-56 56 56 56Z"/>,
    true,
  ),
  delete: icon(
    "0 -960 960 960", // From material design
    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/>,
    true,
  ),
  copy: icon(
    "0 -960 960 960", // From material design
    <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/>,
    true,
  ),
  connection: icon(
    "0 -960 960 960", // From material design
    <path d="M200-120q-17 0-28.5-11.5T160-160v-40h-40v-160q0-17 11.5-28.5T160-400h40v-280q0-66 47-113t113-47q66 0 113 47t47 113v400q0 33 23.5 56.5T600-200q33 0 56.5-23.5T680-280v-280h-40q-17 0-28.5-11.5T600-600v-160h40v-40q0-17 11.5-28.5T680-840h80q17 0 28.5 11.5T800-800v40h40v160q0 17-11.5 28.5T800-560h-40v280q0 66-47 113t-113 47q-66 0-113-47t-47-113v-400q0-33-23.5-56.5T360-760q-33 0-56.5 23.5T280-680v280h40q17 0 28.5 11.5T360-360v160h-40v40q0 17-11.5 28.5T280-120h-80Z"/>,
    true,
  ),
  key: icon(
    "0 -960 960 960", // From material design
    <path d="M365-395q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35Zm-85 155q-100 0-170-70T40-480q0-100 70-170t170-70q81 0 141.5 46T506-560h335l79 79-140 160-100-79-80 80-80-80h-14q-25 72-87 116t-139 44Z"/>,
    true,
  ),
  fingerprint: icon(
    "0 -960 960 960", // From material design
    <path d="M481-781q106 0 200 45.5T838-604q7 9 4.5 16t-8.5 12q-6 5-14 4.5t-14-8.5q-55-78-141.5-119.5T481-741q-97 0-182 41.5T158-580q-6 9-14 10t-14-4q-7-5-8.5-12.5T126-602q62-85 155.5-132T481-781Zm0 94q135 0 232 90t97 223q0 50-35.5 83.5T688-257q-51 0-87.5-33.5T564-374q0-33-24.5-55.5T481-452q-34 0-58.5 22.5T398-374q0 97 57.5 162T604-121q9 3 12 10t1 15q-2 7-8 12t-15 3q-104-26-170-103.5T358-374q0-50 36-84t87-34q51 0 87 34t36 84q0 33 25 55.5t59 22.5q34 0 58-22.5t24-55.5q0-116-85-195t-203-79q-118 0-203 79t-85 194q0 24 4.5 60t21.5 84q3 9-.5 16T208-205q-8 3-15.5-.5T182-217q-15-39-21.5-77.5T154-374q0-133 96.5-223T481-687Zm0-192q64 0 125 15.5T724-819q9 5 10.5 12t-1.5 14q-3 7-10 11t-17-1q-53-27-109.5-41.5T481-839q-58 0-114 13.5T260-783q-8 5-16 2.5T232-791q-4-8-2-14.5t10-11.5q56-30 117-46t124-16Zm0 289q93 0 160 62.5T708-374q0 9-5.5 14.5T688-354q-8 0-14-5.5t-6-14.5q0-75-55.5-125.5T481-550q-76 0-130.5 50.5T296-374q0 81 28 137.5T406-123q6 6 6 14t-6 14q-6 6-14 6t-14-6q-59-62-90.5-126.5T256-374q0-91 66-153.5T481-590Zm-1 196q9 0 14.5 6t5.5 14q0 75 54 123t126 48q6 0 17-1t23-3q9-2 15.5 2.5T744-191q2 8-3 14t-13 8q-18 5-31.5 5.5t-16.5.5q-89 0-154.5-60T460-374q0-8 5.5-14t14.5-6Z"/>,
    true,
  ),
  tile: icon(
    "0 -960 960 960", // From material design
    <path d="M440-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h240v720Zm80-400v-320h240q33 0 56.5 23.5T840-760v240H520Zm0 400v-320h320v240q0 33-23.5 56.5T760-120H520Z"/>,
    true,
  ),
  dataObject: icon(
    "0 -960 960 960", // From material design
    <path d="M560-160v-80h120q17 0 28.5-11.5T720-280v-80q0-38 22-69t58-44v-14q-36-13-58-44t-22-69v-80q0-17-11.5-28.5T680-720H560v-80h120q50 0 85 35t35 85v80q0 17 11.5 28.5T840-560h40v160h-40q-17 0-28.5 11.5T800-360v80q0 50-35 85t-85 35H560Zm-280 0q-50 0-85-35t-35-85v-80q0-17-11.5-28.5T120-400H80v-160h40q17 0 28.5-11.5T160-600v-80q0-50 35-85t85-35h120v80H280q-17 0-28.5 11.5T240-680v80q0 38-22 69t-58 44v14q36 13 58 44t22 69v80q0 17 11.5 28.5T280-240h120v80H280Z"/>,
    true,
  ),
  question: icon(
    "0 -960 960 960", // From material design
    <path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z"/>,
    true,
  ),
} satisfies Record<string, Icon>;
