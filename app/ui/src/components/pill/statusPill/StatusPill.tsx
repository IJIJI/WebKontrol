import { type JSX } from "react/jsx-runtime";

import "./statusPill.less";
import { ConnectionState } from "../../../../../src/types/CommonTypes";
import { InfoPill, PillStyle, PillType } from "../InfoPill";

const STATE_MAP: Record<ConnectionState, PillType> = {
  [ConnectionState.DISABLED]: PillType.DEFAULT,
  [ConnectionState.ERROR]: PillType.DANGER,
  [ConnectionState.FAILED]: PillType.DANGER,
  [ConnectionState.OFFLINE]: PillType.WARNING,
  [ConnectionState.ONLINE]: PillType.SUCCESS,
  [ConnectionState.UNKNOWN]: PillType.DEFAULT,
}

export function StatusPill({size, label, status}: {
  size?: number;
  label: string;
  status: ConnectionState;
  style?: PillStyle;
}): JSX.Element {

  return (
    <InfoPill className="statusPill" type={STATE_MAP[status]} size={size}>
      <span className="dotContainter">
        <div className="dot"></div>
      </span> 
      <span className="infoLabel">
        {label}
      </span>
    </InfoPill>
  );
}
