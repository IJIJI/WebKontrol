import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./infoPill.less";
import { ChipPill } from "./ChipPill";
import { Variant, FillStyle } from "../../helpers/variants";

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
    <ChipPill className={["infoPill", variant, fillStyle, className].filter(Boolean).join(" ")} size={size}>
      {children}
    </ChipPill>
  );
}
