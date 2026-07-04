import type { JSX } from "react/jsx-runtime";

import "./brandLogo.less";

type LogoProps = {
  size?: number;
  subtext?: boolean;
  collapsed?: boolean;
  version: string;
};

export function BrandLogo({
  size = 26,
  subtext = true,
  collapsed = false,
  version,
}: LogoProps): JSX.Element {
  const trail = collapsed ? " collapsed" : "";
  return (
    <div className="brandLogo">
      <h1 className="projectName" style={{ fontSize: size }}>
        <span className="word web">
          W<span className={`trail ${trail}`}>eb</span>
        </span>
        <span className="word kontrol">
          K<span className={`trail ${trail}`}>ontrol</span>
        </span>
      </h1>
      {subtext && (
        <p
          className="subtext"
          style={{
            fontSize: size * 0.5,
            gap: collapsed ? 0 : size * 0.35,
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <span className="version">{version}</span>
          <span className={`divider${trail}`}></span>
          <span className={`producer${trail}`}>Synapt</span>
        </p>
      )}
    </div>
  );
}
