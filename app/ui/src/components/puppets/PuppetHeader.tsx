import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import { useNavigate } from "react-router-dom";
import { useApi, type UiPuppetState } from "../../context/ApiStateContext";
import { Icons } from "../icons/Icons";
import { Icon } from "../icons/Icon";
import { Button } from "../button/Button";
import { FillStyle } from "../../common/types/variants";
import { Dropdown, type DropdownItem } from "../dropdown/Dropdown";
import { EntityHeader } from "../entityHeader/EntityHeader";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { ViewPicker } from "../pickers/ViewPicker";
import { resolvePuppetAppearance } from "../../common/appearance";

export function PuppetHeader({ puppet }: { puppet: UiPuppetState }): JSX.Element {
  const { state } = useApi();
  const navigate = useNavigate();
  const [assignOpen, setAssignOpen] = useState(false);

  const views = state ? [...state.views.values()] : [];

  const appearance = resolvePuppetAppearance(puppet.appearance);

  const menu: DropdownItem[] = [
    { id: "edit", label: "Edit", icon: <Icons.edit />, onClick: () => void navigate(`/puppets/${puppet.config.id}/edit`) },
    ...(puppet.assignedView
      ? [{ id: "unassign", label: "Unassign view", onClick: () => void puppet.unassignView() }] // TODO: Should this be here?
      : []),
  ];

  return (
    <>
      <EntityHeader
        icon={<Icon id={appearance.icon} />}
        color={appearance.color}
        title={puppet.config.name.long}
        subtitle={puppet.config.name.short}
        chips={<StatusPill status={puppet.info.state} />}
        actions={
          <>
            <Button onClick={() => setAssignOpen(true)} fillStyle={FillStyle.FILLED}>
              <Icons.installDesktop />
              <span>Assign view</span>
            </Button>
            <Dropdown ariaLabel="More actions" trigger={<Icons.more />} items={menu} />
          </>
        }
      />
      <ViewPicker
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        views={views}
        title={
          <span>
            Assign view to{" "}
            <b>
              <code>{puppet.config.name.long}</code>
            </b>
          </span>
        }
        confirmLabel="Assign"
        onConfirm={(viewKey) => puppet.assignView(viewKey)}
      />
    </>
  );
}
