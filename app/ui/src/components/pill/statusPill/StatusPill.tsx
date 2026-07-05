import { type JSX } from "react/jsx-runtime";

import "./statusPill.less";
import { ConnectionState } from "../../../../../src/types/CommonTypes";
import { InfoPill, PillStyle, PillType } from "../InfoPill";

const STATE_MAP: Record<ConnectionState, {type: PillType, style: PillStyle, label: string}> = {
  [ConnectionState.DISABLED]: { type: PillType.DEFAULT, style: PillStyle.SKELETON, label: "Disabled" },
  [ConnectionState.ERROR]: { type: PillType.WARNING, style: PillStyle.FILLED, label: "Error" },
  [ConnectionState.FAILED]: { type: PillType.DANGER, style: PillStyle.FILLED, label: "Failed" },
  [ConnectionState.OFFLINE]: { type: PillType.WARNING, style: PillStyle.FILLED, label: "Offline" },
  [ConnectionState.ONLINE]: { type: PillType.SUCCESS, style: PillStyle.SKELETON, label: "Online" },
  [ConnectionState.UNKNOWN]: { type: PillType.WARNING, style: PillStyle.FILLED, label: "Unknown" },
}

export function StatusPill(props: {
  size?: number;
  label?: string;
  status: ConnectionState;
  style?: PillStyle;
  collapsed?: boolean
}): JSX.Element {
  const state = STATE_MAP[props.status];
  const style = props.style ? props.style : state.style;
  const label = props.label ? props.label : state.label;

  return (
    <InfoPill className={"statusPill" + (props.collapsed ? " collapsed" : "")} style={style} type={state.type} size={props.size}>
      <span className="dotContainter">
        <div className="dot"></div>
      </span> 
      <span className="infoLabel">
        {label}
      </span>
    </InfoPill>
  );
}
