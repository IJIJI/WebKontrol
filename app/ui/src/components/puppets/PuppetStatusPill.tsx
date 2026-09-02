import { type JSX } from "react/jsx-runtime";

import { StatusPill } from "../pill/statusPill/StatusPill";
import { type PuppetInfo } from "../../../../src/puppet/types/model";
import { type FillStyle } from "../../common/types/variants";
import { puppetStatus } from "./puppetStatus";

/**
 * One pill for a puppet, for the places that can only show one thing (a header, a list row):
 * whichever of its two axes is worse. See {@link puppetStatus} for the precedence and why.
 *
 * Where there is room for both, show them separately instead (the puppet page keeps a row per
 * axis): this pill answers "is anything wrong", not "what exactly".
 */
export function PuppetStatusPill({
  info,
  ...props
}: {
  info: PuppetInfo;
  size?: number;
  fillStyle?: FillStyle;
  collapsed?: boolean;
}): JSX.Element {
  const { status, label } = puppetStatus(info);
  return <StatusPill {...props} status={status} label={label} />;
}
