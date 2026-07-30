import { type JSX } from "react/jsx-runtime";

import { type UiViewState } from "../../context/ApiStateContext";
import { DetailList, type DetailRow } from "../detailList/DetailList";
import { SettingGroup } from "../settings/SettingGroup";
import { BlockExplorer } from "../blockTree/BlockExplorer";

// A read-only summary of a view's type-specific config: a website (url + params) or a block tree.
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
          <BlockExplorer root={config.root} />
        </SettingGroup>
      );
    default:
      // Exhaustive: adding a new view type must be handled above, or this fails to compile.
      config satisfies never;
      return <></>;
  }
}
