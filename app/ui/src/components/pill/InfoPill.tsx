import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./infoPill.less";
import { ChipPill } from "./ChipPill";
import { Variant, FillStyle } from "../../common/types/variants";
import { classNames } from "../../common/helpers/classNames";

export function InfoPill({
  variant = Variant.DEFAULT,
  fillStyle = FillStyle.FILLED,
  children,
  size,
  className,
}: {
  variant?: Variant;
  fillStyle?: FillStyle;
  children: ReactNode;
  size?: number;
  className?: string;
}): JSX.Element {
  return (
    <ChipPill className={classNames("infoPill", variant, fillStyle, className)} size={size}>
      {children}
    </ChipPill>
  );
}
