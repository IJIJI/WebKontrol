import { type JSX } from "react/jsx-runtime";

import "./statusDot.less";
import { Variant } from "../../../common/types/variants";
import { classNames } from "../../../common/helpers/classNames";

// A glowing status dot, coloured by variant. Used by StatusPill and each GroupStatusPill row.
export function StatusDot({ variant = Variant.DEFAULT }: { variant?: Variant }): JSX.Element {
  return (
    <span className="statusDotContainer">
      <span className={classNames("statusDot", variant)} />
    </span>
  );
}
