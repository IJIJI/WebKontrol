import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./infoPill.less";
import { ChipPill } from "./ChipPill";
import { Variant, FillStyle } from "../../helpers/variants";

export function InfoPill({
  type = Variant.DEFAULT,
  style = FillStyle.FILLED,
  children,
  size,
  className,
}: {
  type?: Variant;
  style?: FillStyle;
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
