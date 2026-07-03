import { useRef } from "react";
import { JSX } from "react/jsx-runtime";

import "./settings.less";

// TODO: Add an easy way to add an InfoPill
export function BaseSetting({title, subtitle, inputRef, children}: {title: string, subtitle: string, inputRef: React.RefObject<HTMLInputElement | null>, children: JSX.Element}): JSX.Element {

  return (
    <div className="setting field" onClick={() => inputRef.current?.focus()}>
      <div className="title">
        <span className="title">{title}</span>
        <span className="subtitle">{subtitle}</span>
      </div>
      <div className="input">
        {children}
      </div>
    </div>
  );

}