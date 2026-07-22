import { ReactNode } from "react";
import { JSX } from "react/jsx-runtime";


export interface FrameBoxProps {
  children: ReactNode;
  color: string; // TODO: Better color type?
  size: number;
  className?: string;
}

export function FrameBox(props: FrameBoxProps): JSX.Element {
  return (
    <div className={["frameBox", props.className].filter(Boolean).join(" ")} style={{backgroundColor: props.color}}>
      {props.children}
    </div>
  );
}