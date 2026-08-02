import { type JSX } from "react/jsx-runtime";

import "./statusPill.less";
import { ConnectionState } from "../../../../../src/types/CommonTypes";
import { InfoPill } from "../InfoPill";
import { Variant, FillStyle } from "../../../common/types/variants";
import { classNames } from "../../../common/helpers/classNames";

const STATE_MAP: Record<ConnectionState, { variant: Variant; fillStyle: FillStyle; label: string }> = {
  [ConnectionState.DISABLED]: { variant: Variant.DEFAULT, fillStyle: FillStyle.FILLED, label: "Disabled" },
  [ConnectionState.ERROR]: { variant: Variant.WARNING, fillStyle: FillStyle.FILLED, label: "Error" },
  [ConnectionState.FAILED]: { variant: Variant.DANGER, fillStyle: FillStyle.FILLED, label: "Failed" },
  [ConnectionState.OFFLINE]: { variant: Variant.WARNING, fillStyle: FillStyle.FILLED, label: "Offline" },
  [ConnectionState.ONLINE]: { variant: Variant.SUCCESS, fillStyle: FillStyle.FILLED, label: "Online" },
  [ConnectionState.UNKNOWN]: { variant: Variant.WARNING, fillStyle: FillStyle.FILLED, label: "Unknown" },
};

export function StatusPill(props: {
  size?: number;
  label?: string;
  status: ConnectionState;
  fillStyle?: FillStyle;
  collapsed?: boolean;
}): JSX.Element {
  const state = STATE_MAP[props.status];
  const fillStyle = props.fillStyle ? props.fillStyle : state.fillStyle;
  const label = props.label ? props.label : state.label;

  return (
    <InfoPill
      className={classNames("statusPill", props.collapsed && "collapsed")}
      variant={state.variant}
      fillStyle={fillStyle}
      size={props.size}
    >
      <span className="dotContainter">
        <div className="dot"></div>
      </span>
      <span className="infoLabel">{label}</span>
    </InfoPill>
  );
}
