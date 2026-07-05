import { type JSX } from "react/jsx-runtime";

import "./pill.less";


export enum PillType { // TODO: Move to a more general type? It is used in more places.
  DEFAULT = "default",
  ACCENT = "accent",
  SUCCESS = "success",
  DANGER = "danger",
  WARNING = "warning",
  INFO = "info",
}

export enum PillStyle { // TODO: Move to a more general type? It is used in more places.
  FILLED = "filled",
  SKELETON = "skeleton",
}

export function InfoPill({type, style, children, size}: {
  type?: PillType;
  style?: PillStyle;
  children: string | JSX.Element | JSX.Element[];
  size?: number;
}): JSX.Element {

  return (
    <div 
      className={"infoPill " + type + " " + style}
      style={{ fontSize: size }}
    >
      {children}
    </div>
  );
}
