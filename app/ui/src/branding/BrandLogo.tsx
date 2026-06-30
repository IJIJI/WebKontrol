import { JSX } from "react/jsx-runtime";

type LogoProps = { 
  size: number, 
  subtext: boolean,
  version: string
}

export default function BrandLogo(props: LogoProps): JSX.Element {
  return(<div className="logo">
    <h1 className="projectName" style={{fontSize: props.size}}>WebKontrol</h1>
    { props.subtext &&
      <p className="subtext" style={{fontSize: props.size * 0.2}}>
        <span className="version">
          {props.version}
          </span> 
        - Synapt Technologies
      </p>
    }
  </div>);
}
