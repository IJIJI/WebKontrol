import { type JSX } from "react/jsx-runtime";

import "./bar.less";

export function BottomBar({
  visible,
  children,
  className
}: {
  visible: boolean,
  children: JSX.Element | JSX.Element[]
  className?: string
}): JSX.Element {
  return (
    <div className={"bottomBar container " + (className ?? "") + (!visible ? " hidden" : "")}>
      <div className={"bottomBar content " + (className ?? "") + (!visible ? " hidden" : "")}>
        {children}
      </div>
    </div>
  );
}
