import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./infoPill.less";
import { ChipPill } from "./ChipPill";

// TODO: unify with Button's ButtonType/ButtonStyle into one shared variants module.
export enum PillType {
  DEFAULT = "default",
  ACCENT = "accent",
  SUCCESS = "success",
  DANGER = "danger",
  WARNING = "warning",
  INFO = "info",
}

export enum PillStyle {
  FILLED = "filled",
  SKELETON = "skeleton",
}

export function InfoPill({
  type = PillType.DEFAULT,
  style = PillStyle.FILLED,
  children,
  size,
  className,
}: {
  type?: PillType;
  style?: PillStyle;
  children: ReactNode;
  size?: number;
  className?: string;
}): JSX.Element {
  return (
    <ChipPill className={["infoPill", type, style, className].filter(Boolean).join(" ")} size={size}>
      {children}
    </ChipPill>
  );
}
