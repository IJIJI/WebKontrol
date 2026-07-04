import type { JSX } from "react/jsx-runtime";
import { BrandLogo } from "../../branding/BrandLogo";

import "./header.less";

export default function MobileHeader({
  version,
  setCollapsed,
  className,
}: {
  version: string;
  setCollapsed: (state: boolean) => void;
  className?: string;
}): JSX.Element {
  // TODO logo a link and autocollapse.
  return (
    <div className={["header", "mobile", className].filter(Boolean).join(" ")}>
      <BrandLogo size={30} version={version} />
    </div>
  );
}
