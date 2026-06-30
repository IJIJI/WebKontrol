import type { JSX } from "react/jsx-runtime";
import { BrandLogo } from "../../branding/BrandLogo";

import "./header.less";

export default function DesktopHeader({version, setCollapsed}: {version: string, setCollapsed: (state: boolean) => void}): JSX.Element {
  // TODO logo a link and autocollapse.
  return(
    <div className="header desktop">
      <BrandLogo size={30} version={version} /> 
    </div>
  );
}
