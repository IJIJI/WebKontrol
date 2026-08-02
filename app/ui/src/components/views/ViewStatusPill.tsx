import { JSX } from "react/jsx-runtime";
import { UiViewState, useApi } from "../../context/ApiStateContext";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { ConnectionState } from "../../../../src/types/CommonTypes";
import { FillStyle } from "../../common/variants";

    
export function ViewStatusPill({ view, ...props }: { view: UiViewState; size?: number; fillStyle?: FillStyle; collapsed?: boolean; }): JSX.Element {
  const { state } = useApi()

  const activePuppets = view.activePuppets;
  const status = activePuppets.length <= 0 ? ConnectionState.DISABLED : ConnectionState.FAILED;
  const label = activePuppets.length <= 0 ? "Inactive" : 
                  ( activePuppets.length == 1 ? state?.puppets.get(activePuppets[0])?.config.name.short ?? activePuppets[0] : `Active ${activePuppets.length}x` ); // TODO Simplify
  
  return (
    <StatusPill {...props} status={status} label={label} />
  ); // TODO: Implement GroupStatusPill and use it to show what views are active on hover, with more then one active puppet or when collapsed.
}