import { type JSX } from "react/jsx-runtime";

import { type UiViewState } from "../../context/ApiStateContext";
import { DetailList, type DetailRow } from "../detailList/DetailList";
import { SettingGroup } from "../settings/SettingGroup";
import { BlockTree } from "../blockTree/BlockTree";

// A read-only summary of a view's type-specific config. Website (url + params) is done here;
// the blocks-only tree comes next.
export function ViewConfigSummary({ view }: { view: UiViewState }): JSX.Element {
  const { config } = view;

  switch (config.type) {
    case "url": {
      const rows: DetailRow[] = [{ label: "URL", value: config.url, copy: config.url }];
      for (const [param, value] of Object.entries(config.parameters ?? {})) {
        rows.push({ label: param, value });
      }
      return <DetailList title="Website" rows={rows} />;
    }
    case "blocks":
      return (
        <SettingGroup title="Blocks">
          <BlockTree root={config.root} />
        </SettingGroup>
      );
    default:
      return <></>;
  }
}
