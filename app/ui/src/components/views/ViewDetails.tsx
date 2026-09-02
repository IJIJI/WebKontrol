import { type JSX } from "react/jsx-runtime";

import { useApi, type UiViewState } from "../../context/ApiStateContext";
import { DetailList, type DetailRow } from "../detailList/DetailList";
import { VIEW_TYPE_META } from "./viewMeta";

// The view's Details section: identity + config facts that don't fit in the header chips.
export function ViewDetails({ view }: { view: UiViewState }): JSX.Element {
  const { state } = useApi();
  const { key, config } = view;
  const defaultTimeout = state?.runtime.view.default_load_timeout;

  const loadTimeout =
    config.loadTimeout != null
      ? `${config.loadTimeout} ms`
      : defaultTimeout != null
        ? `Inherited (${defaultTimeout} ms)`
        : "Inherited";

  const rows: DetailRow[] = [
    { label: "Key", value: key, copy: key },
    { label: "Name", value: config.name.long },
    { label: "Short name", value: config.name.short || "—" },
    { label: "Type", value: VIEW_TYPE_META[config.type].label },
    { label: "Load timeout", value: loadTimeout },
  ];

  return <DetailList title="Details" rows={rows} />;
}
