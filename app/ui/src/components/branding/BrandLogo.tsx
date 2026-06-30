import { JSX } from "react/jsx-runtime";

import "./brandLogo.less";

type LogoProps = { 
  size?: number, 
  subtext?: boolean,
  version: string
}

export function BrandLogo({size = 26, subtext = true, version}: LogoProps): JSX.Element {
  return(<div className="logo">
    <h1 className="projectName" style={{fontSize: size}}>WebKontrol</h1>
    { subtext &&
      <p className="subtext" style={{fontSize: size * 0.4}}>
        <span className="version">
          {version}
        </span>
        <span className="divider">
        -
        </span>
        <span className="producer">
        Synapt Technologies
        </span>
      </p>
    }
  </div>);
}
