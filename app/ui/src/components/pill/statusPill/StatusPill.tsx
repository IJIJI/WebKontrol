import { type JSX } from "react/jsx-runtime";

import "./statusPill.less";
import { ConnectionState } from "../../../../../src/types/CommonTypes";
import { InfoPill } from "../InfoPill";
import { Variant, FillStyle } from "../../../helpers/variants";

const STATE_MAP: Record<ConnectionState, {type: Variant, style: FillStyle, label: string}> = {
  [ConnectionState.DISABLED]: { type: Variant.DEFAULT, style: FillStyle.SKELETON, label: "Disabled" },
  [ConnectionState.ERROR]: { type: Variant.WARNING, style: FillStyle.FILLED, label: "Error" },
  [ConnectionState.FAILED]: { type: Variant.DANGER, style: FillStyle.FILLED, label: "Failed" },
  [ConnectionState.OFFLINE]: { type: Variant.WARNING, style: FillStyle.FILLED, label: "Offline" },
  [ConnectionState.ONLINE]: { type: Variant.SUCCESS, style: FillStyle.SKELETON, label: "Online" },
  [ConnectionState.UNKNOWN]: { type: Variant.WARNING, style: FillStyle.FILLED, label: "Unknown" },
}

export function StatusPill(props: {
  size?: number;
  label?: string;
  status: ConnectionState;
  style?: FillStyle;
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
