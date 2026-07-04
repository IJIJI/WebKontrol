import type { JSX } from "react/jsx-runtime";
import { BrandLogo } from "../../branding/BrandLogo";

import "./header.less";
import ContentSection from "../content/ContentSection";

export default function DesktopHeader({
  version,
  collapsed,
  setCollapsed,
  className,
}: {
  version: string;
  collapsed: boolean;
  setCollapsed: (state: boolean) => void;
  className?: string;
}): JSX.Element {
  // TODO logo a link and autocollapse.
  return (
    <ContentSection
      variant="glass"
      className={["header", "desktop", "pad-xs", className]
        .filter(Boolean)
        .join(" ")}
    >
      <BrandLogo size={20} version={version} collapsed={collapsed} />
    </ContentSection>
  );
}
