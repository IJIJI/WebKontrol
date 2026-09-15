import { type JSX } from "react/jsx-runtime";

import "./statusPill.less";
import { type ConnectionState } from "../../../../../src/types/CommonTypes";
import { InfoPill } from "../InfoPill";
import { type FillStyle } from "../../../common/types/variants";
import { classNames } from "../../../common/helpers/classNames";
import { STATUS_META } from "./statusMeta";
import { StatusDot } from "./StatusDot";

export function StatusPill(props: {
  size?: number;
  label?: string;
  status: ConnectionState;
  fillStyle?: FillStyle;
  collapsed?: boolean;
}): JSX.Element {
  const state = STATUS_META[props.status];
  const fillStyle = props.fillStyle ? props.fillStyle : state.fillStyle;
  const label = props.label ? props.label : state.label;

  return (
    <InfoPill
      className={classNames("statusPill", props.collapsed && "collapsed")}
      variant={state.variant}
      fillStyle={fillStyle}
      size={props.size}
    >
      <StatusDot variant={state.variant} />
      <span className="infoLabel">{label}</span>
    </InfoPill>
  );
}
