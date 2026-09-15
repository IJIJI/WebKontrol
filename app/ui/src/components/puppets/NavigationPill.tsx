import { type JSX } from "react/jsx-runtime";

import { StatusPill } from "../pill/statusPill/StatusPill";
import { ConnectionState } from "../../../../src/types/CommonTypes";
import { NavigationState, type NavigationInfo } from "../../../../src/puppet/types/model";
import { type FillStyle } from "../../common/types/variants";

/**
 * Whether the page a puppet was told to show is actually up. Separate from the connection pill,
 * which answers a different question: a browser can be perfectly Online while the wall shows a
 * DNS error, which is exactly the case that used to be invisible outside the logs.
 *
 * A failure is labelled by its *kind* rather than by the word "Failed": Network and Status 404
 * are different problems with different answers, and the kind is also what says whether waiting
 * for the automatic retry could help at all.
 */
export function NavigationPill({
  navigation,
  ...props
}: {
  navigation: NavigationInfo;
  size?: number;
  fillStyle?: FillStyle;
  collapsed?: boolean;
}): JSX.Element {
  // ConnectionState is borrowed for its pill variant only (the same way ViewStatusPill does it);
  // it is not a claim about the connection, which has its own pill in the header.
  const { status, label } = describe(navigation);
  return <StatusPill {...props} status={status} label={label} />;
}

function describe(navigation: NavigationInfo): { status: ConnectionState; label: string } {
  switch (navigation.state) {
    case NavigationState.LOADED:
      return { status: ConnectionState.ONLINE, label: "Loaded" };
    case NavigationState.LOADING:
      return { status: ConnectionState.UNKNOWN, label: "Loading" };
    case NavigationState.FAILED:
      return {
        status: ConnectionState.FAILED,
        // The HTTP code is the whole story for a STATUS failure, and useless noise elsewhere.
        label: navigation.status === undefined
          ? navigation.failure
          : `${navigation.failure} ${navigation.status}`,
      };
    case NavigationState.IDLE:
      return { status: ConnectionState.DISABLED, label: "No page" };
  }
}
