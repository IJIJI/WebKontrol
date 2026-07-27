import { type JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { type UiViewState } from "../../context/ApiStateContext";
import { ConnectionState } from "../../../../src/types/CommonTypes";
import { Icons } from "../icons/Icons";
import { Button, ButtonStyle } from "../button/Button";
import { Dropdown, type DropdownItem } from "../dropdown/Dropdown";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { EntityHeader } from "../entityHeader/EntityHeader";
import { ViewTypeChip } from "./ViewTypeChip";
import { VIEW_TYPE_META } from "./viewMeta";

// Neutral badge colour until views carry their own colour (EntityMeta, #6).
const NEUTRAL_COLOR = "#a3a0a8";

// A view's detail-page header: fills EntityHeader with view-specific content.
export function ViewHeader({ view }: { view: UiViewState }): JSX.Element {
  const navigate = useNavigate();
  const { key, config } = view;
  const TypeIcon = VIEW_TYPE_META[config.type].icon;
  const serveUrl = `/view/${key}`; // TODO: route_base is configurable; hardcoded /view for now

  const menu: DropdownItem[] = [
    { id: "open", label: "Open in new tab", icon: <Icons.openInNew />, onClick: () => void window.open(serveUrl, "_blank", "noopener") },
    { id: "edit", label: "Edit", icon: <Icons.edit />, onClick: () => void navigate(`/views/${key}/edit`) },
    // Duplicate + Delete are placeholders until their action modals (#16).
    { id: "duplicate", label: "Duplicate", icon: <Icons.tabDuplicate />, onClick: () => void toast("Duplicate coming soon") },
    { divider: true },
    { id: "delete", label: "Delete", icon: <Icons.delete />, danger: true, onClick: () => void toast("Delete coming soon") },
  ];

  return (
    <EntityHeader
      icon={<TypeIcon />}
      color={NEUTRAL_COLOR}
      title={config.name.long}
      subtitle={config.name.short}
      chips={
        <>
          <ViewTypeChip type={config.type} />
          {/* Placeholder until assignment/open data is wired. */}
          <StatusPill status={ConnectionState.DISABLED} label="Not displayed" />
        </>
      }
      actions={
        <>
          <Button onClick={() => void toast("Assigning coming soon")} style={ButtonStyle.FILLED}>
            <Icons.installDesktop />
            <span>Assign</span>
          </Button>
          <Button onClick={() => void toast("Sharing coming soon")} style={ButtonStyle.FILLED}>
            <Icons.share />
            <span>Share</span>
          </Button>
          <Dropdown ariaLabel="More actions" trigger={<Icons.more />} items={menu} />
        </>
      }
    />
  );
}
