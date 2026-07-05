import { type JSX } from "react/jsx-runtime";

import "./pill.less";
import { RefObject } from "react";


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

export function TextPill({type, style, children, size}: {
  type?: PillType;
  style?: PillStyle;
  children: string | JSX.Element | JSX.Element[];
  size?: number;
}): JSX.Element {

  return (
    <div 
      className={"textPill " + type + " " + style}
      style={{ fontSize: size }}
    >
      {children}
    </div>
  );
}
