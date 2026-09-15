import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./chipPill.less";

export function ChipPill({
  children,
  color,
  size,
  className,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={["chipPill", color && "colored", className].filter(Boolean).join(" ")}
      style={{ fontSize: size, ...(color ? { "--chip-color": color } : {}) }}
    >
      {children}
    </div>
  );
}
