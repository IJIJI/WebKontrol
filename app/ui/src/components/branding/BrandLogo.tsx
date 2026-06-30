import type { JSX } from "react/jsx-runtime";

import "./brandLogo.less";

type LogoProps = { 
  size?: number, 
  subtext?: boolean,
  version: string
}

export function BrandLogo({size = 26, subtext = true, version}: LogoProps): JSX.Element {
  return(<div className="brandLogo">
    <h1 className="projectName" style={{fontSize: size}}>
      <span className="web">
        Web
      </span>
      <span className="kontrol">
        Kontrol
      </span>
    </h1>
    { subtext &&
      <p className="subtext" style={{fontSize: size * 0.5, gap: size * 0.35}}>
        <span className="version">
          {version}
        </span>
        <span className="divider">
        
        </span>
        <span className="producer">
        Synapt
        </span>
      </p>
    }
  </div>);
}
