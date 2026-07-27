import { type JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import "./viewHeader.less";
import { useApi, type UiViewState } from "../../context/ApiStateContext";
import { ConnectionState } from "../../../../src/types/CommonTypes";
import { FrameBox } from "../frameBox/FrameBox";
import { Icons } from "../icons/Icons";
import { Button, ButtonStyle } from "../button/Button";
import { Dropdown, type DropdownItem } from "../dropdown/Dropdown";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { ViewTypeChip } from "./ViewTypeChip";
import { VIEW_TYPE_META } from "./viewMeta";

// Neutral badge colour until views carry their own colour.
const NEUTRAL_COLOR = "#a3a0a8";

export function ViewHeader({ view }: { view: UiViewState }): JSX.Element {
  const navigate = useNavigate();
  const { callBacks } = useApi();
  const { key, config } = view;
  const TypeIcon = VIEW_TYPE_META[config.type].icon;
  const serveUrl = `/view/${key}`; // TODO: route_base is configurable; hardcoded /view for now

  // Clone the config under a new name; the backend mints a fresh key.
  const duplicate = async (): Promise<void> => {
    const copy = {
      ...config,
      name: { long: `Copy of ${config.name.long}`, short: config.name.short },
    };
    const newKey = await callBacks.view.create(copy);
    void navigate(`/views/${newKey}/edit`);
  };

  const menu: (DropdownItem | "divider")[] = [ // TODO: Icons are large, tweak.
    { id: "open", label: "Open in new tab", icon: <Icons.openInNew />, onClick: () => void window.open(serveUrl, "_blank", "noopener") },
    { id: "edit", label: "Edit", icon: <Icons.edit />, onClick: () => void navigate(`/views/${key}/edit`) },
    { id: "duplicate", label: "Duplicate", icon: <Icons.tabDuplicate />, onClick: duplicate },
    "divider",
    // Delete is a placeholder until its confirm + puppet-replacement guards (#16).
    { id: "delete", label: "Delete", icon: <Icons.delete />, danger: true, onClick: () => void toast("Delete coming soon") },
  ];

  return (
    <header className="viewHeader">
      <FrameBox color={NEUTRAL_COLOR} className="icon">
        <TypeIcon />
      </FrameBox>

      <div className="titleBlock">
        <h1 className="title">{config.name.long}</h1>
        <div className="subtitle">
          <span className="key">{key}</span>
          <span className="divider">·</span>
          {config.name.short && <span className="short">{config.name.short}</span>}
        </div>
        <div className="chips">
          <ViewTypeChip type={config.type} />
          {/* Placeholder until assignment/open data is wired. */}
          <StatusPill status={ConnectionState.DISABLED} label="Not displayed" />
        </div>
      </div>

      <div className="actions">
        <Button onClick={() => void toast("Assigning coming soon")} style={ButtonStyle.FILLED}>
          <Icons.installDesktop />
          <span>Assign</span>
        </Button>
        <Button onClick={() => void toast("Sharing coming soon")} style={ButtonStyle.FILLED}>
          <Icons.share />
          <span>Share</span>
        </Button>
        <Dropdown ariaLabel="More actions" trigger={<Icons.more />} items={menu} />
      </div>
    </header>
  );
}
