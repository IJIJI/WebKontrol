import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { type JSX, useEffect } from "react";
import { ViewHeader } from "../components/views/ViewHeader";
import { ViewDetails } from "../components/views/ViewDetails";
import { ViewConfigSummary } from "../components/views/ViewConfigSummary";
import { BlockExplorer } from "../components/blockTree/BlockExplorer";
import { type BlockLike } from "../components/blockTree/model/blockUtils";
import { SettingGroup } from "../components/settings/SettingGroup";
import "./viewPage.less";

// TODO: remove — example data (real webkontrol blocks) to preview the block explorer.
const bk = (t: string): string => `webkontrol::block::${t}`;
const EXAMPLE_BLOCK: BlockLike = {
  type: bk("container"),
  style: { background: "#0b0b12", padding: "24px" },
  block: {
    type: bk("grid"),
    blocks: [
      {
        type: bk("container"),
        style: { background: "#161622", padding: "16px", border: "1px solid #2a2a3a" },
        block: {
          type: bk("text"),
          text: "Welcome to the lobby",
          style: { fontSize: 42, align: "center", fontFamily: "Inter" },
        },
      },
      {
        type: bk("datetime"),
        format: "H:i:s",
        style: { fontSize: 64, align: "center" },
      },
      {
        type: bk("website"),
        url: "https://status.example.com",
      },
      {
        type: bk("freeform"),
        items: [
          {
            block: { type: bk("text"), text: "Top left", style: { fontSize: 20, align: "left" } },
            position: { x: 5, y: 5 },
            size: { x: 40, y: 20 },
          },
          {
            block: { type: bk("datetime"), format: "D, d M", style: { fontSize: 24, align: "right" } },
            position: { x: 60, y: 5 },
            size: { x: 35, y: 15 },
          },
        ],
      },
    ],
  },
};

export default function ViewPage(): JSX.Element {
  const { viewKey } = useParams();
  const { state } = useApi();
  const { setMeta } = usePageContext();

  const view = viewKey ? state?.views.get(viewKey) : undefined;
  const title = view?.config.name.long ?? viewKey ?? "Unknown View";

  useEffect(() => {
    setMeta({ title: ["overview", { label: "views", path: "/views" }, title] }, true);
  }, [setMeta, title]);

  return (
    <>
      {view ? (
        <>
          <ViewHeader view={view} />
          <div className="pageSections">
            <ViewDetails view={view} />
            <ViewConfigSummary view={view} />
            {/* TODO: remove — example BlockTree to preview its styling. */}
            <SettingGroup title="Block tree (example)">
              <BlockExplorer root={EXAMPLE_BLOCK} />
            </SettingGroup>
          </div>
        </>
      ) : (
        <h1>{title}</h1>
      )}
      {/* TODO: more sections (assignments, config summary, health, usage). */}
    </>
  );
}
