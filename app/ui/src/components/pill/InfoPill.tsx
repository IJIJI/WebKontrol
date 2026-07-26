import { type JSX } from "react/jsx-runtime";

import "./pill.less";

// TODO: Extract a base, typeless chip (e.g. ChipPill) — just the pill shape/layout with no
// semantic PillType/coloring, and rebuild InfoPill on top of it. The grey view-type chip
// (ViewTypeChip) should then use that base directly instead of PillType.DEFAULT.


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

export function InfoPill({type, style, children, size, className}: {
  type?: PillType;
  style?: PillStyle;
  children: string | JSX.Element | JSX.Element[];
  size?: number;
  className?: string;
}): JSX.Element {
  const compStyle = style ?? PillStyle.FILLED;

  return (
    <div 
      className={"infoPill " + (className ? className+" " : "") + type + " " + compStyle}
      style={{ fontSize: size }}
    >
      {children}
    </div>
  );
}
