import { JSX } from "react/jsx-runtime";
import { BrandLogo } from "../../branding/BrandLogo";

import "./header.less";

export default function HeaderExpandButton({trigger}: { trigger: () => void}): JSX.Element {
  // TODO logo a link and autocollapse.
  return(
    <button 
      className="headerExpand"
      onClick={trigger}
      aria-label="Open Menu"
    >
    
    </button>
  );
}
