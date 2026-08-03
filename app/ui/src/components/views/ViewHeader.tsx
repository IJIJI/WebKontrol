import { useState } from "react";
import { type JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useApi, type UiViewState } from "../../context/ApiStateContext";
import { Icons } from "../icons/Icons";
import { Icon } from "../icons/Icon";
import { Button } from "../button/Button";
import { FillStyle } from "../../common/types/variants";
import { Dropdown, type DropdownItem } from "../dropdown/Dropdown";
import { EntityHeader } from "../entityHeader/EntityHeader";
import { AssignViewModal } from "./AssignViewModal";
import { DeleteViewModal } from "./DeleteViewModal";
import { DuplicateViewModal } from "./DuplicateViewModal";
import { ViewTypeChip } from "./ViewTypeChip";
import { ViewStatusPill } from "./ViewStatusPill";

// A view's detail-page header: fills EntityHeader with view-specific content.
export function ViewHeader({ view }: { view: UiViewState }): JSX.Element {
  const navigate = useNavigate();
  const { state } = useApi();
  const { key, config } = view;
  const serveUrl = `/view/${key}`; // TODO: route_base is configurable; hardcoded /view for now

  const [assignOpen, setAssignOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const puppets = state ? [...state.puppets.values()] : [];

  const menu: DropdownItem[] = [
    { id: "open", label: "Open in new tab", icon: <Icons.openInNew />, onClick: () => void window.open(serveUrl, "_blank", "noopener") },
    { id: "edit", label: "Edit", icon: <Icons.edit />, onClick: () => void navigate(`/views/${key}/edit`) },
    { id: "duplicate", label: "Duplicate", icon: <Icons.tabDuplicate />, onClick: () => setDuplicateOpen(true) },
    { divider: true },
    { id: "delete", label: "Delete", icon: <Icons.delete />, danger: true, onClick: () => setDeleteOpen(true) },
  ];

  return (
    <>
      <EntityHeader
        icon={<Icon id={view.appearance.icon} />}
        color={view.appearance.color}
        title={config.name.long}
        subtitle={config.name.short}
        chips={
          <>
            <ViewTypeChip type={config.type} />
            <ViewStatusPill view={view} />
          </>
        }
        actions={
          <>
            <Button onClick={() => setAssignOpen(true)} fillStyle={FillStyle.FILLED}>
              <Icons.installDesktop />
              <span>Assign</span>
            </Button>
            <Button onClick={() => void toast("Sharing coming soon")} fillStyle={FillStyle.FILLED}>
              <Icons.share />
              <span>Share</span>
            </Button>
            <Dropdown ariaLabel="More actions" trigger={<Icons.more />} items={menu} />
          </>
        }
      />
      <AssignViewModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        view={view}
        puppets={puppets}
      />
      <DuplicateViewModal open={duplicateOpen} onClose={() => setDuplicateOpen(false)} view={view} />
      <DeleteViewModal open={deleteOpen} onClose={() => setDeleteOpen(false)} view={view} />
    </>
  );
}
