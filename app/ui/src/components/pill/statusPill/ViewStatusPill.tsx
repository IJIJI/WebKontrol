import { JSX } from "react/jsx-runtime";
import { UiViewState, useApi } from "../../../context/ApiStateContext";
import { StatusPill } from "./StatusPill";
import { ConnectionState } from "../../../../../src/types/CommonTypes";




export function ViewStatusPill({ view }: { view: UiViewState }): JSX.Element {
  const { state } = useApi()

  const activePuppets = view.activePuppets;
  const status = activePuppets.length <= 0 ? ConnectionState.DISABLED : ConnectionState.FAILED;
  const label = activePuppets.length <= 0 ? "Not Displayed" : 
                  ( activePuppets.length == 1 ? state?.puppets.get(activePuppets[0])?.config.name.short ?? activePuppets[0] : `Active ${activePuppets.length}x` ); // TODO Simplify
  
  return (
    <StatusPill status={status} label={label} />
  );
}