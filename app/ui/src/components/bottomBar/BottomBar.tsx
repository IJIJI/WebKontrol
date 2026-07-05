import { type JSX } from "react/jsx-runtime";

import "./bar.less";

export function BottomBar({
  visible,
  children
}: {
  visible: boolean,
  children: JSX.Element | JSX.Element[]
}): JSX.Element {
  return (
    <div className="bottomBar container">
      <div className={"bottomBar content" + (!visible ? " hidden" : "")}>
        {children}
      </div>
    </div>
  );
}
