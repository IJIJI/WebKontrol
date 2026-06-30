import type { JSX } from "react/jsx-runtime";

import "./header.less";
import { Icons } from "../../icons/Icons";

export default function HeaderExpandButton({trigger}: { trigger: () => void}): JSX.Element {
  // TODO logo a link and autocollapse.
  return(
    <button 
      className="headerExpand"
      onClick={trigger}
      aria-label="Open Menu"
    >
      <Icons.burger size={24} />
    </button>
  );
}
