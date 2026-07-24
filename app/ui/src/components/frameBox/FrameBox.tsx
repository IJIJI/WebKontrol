import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";


export interface FrameBoxProps {
  children: ReactNode;
  color: string; // TODO: Better color type?
  className?: string;
}

export function FrameBox(props: FrameBoxProps): JSX.Element {
  return (
    <div className={["frameBox", props.className].filter(Boolean).join(" ")} style={{backgroundColor: props.color}}>
      {props.children}
    </div>
  );
}