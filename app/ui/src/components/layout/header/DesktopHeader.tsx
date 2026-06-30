import type { JSX } from "react/jsx-runtime";
import { BrandLogo } from "../../branding/BrandLogo";

import "./header.less";
import ContentSection from "../content/ContentSection";

export default function DesktopHeader({version, setCollapsed, className}: {version: string, setCollapsed: (state: boolean) => void, className?: string }): JSX.Element {
  // TODO logo a link and autocollapse.
  return(
    <ContentSection variant="glass" className={["header", "desktop", "pad-s", className].filter(Boolean).join(" ")} >
      <BrandLogo size={30} version={version} /> 
    </ContentSection>
    
  );
}
