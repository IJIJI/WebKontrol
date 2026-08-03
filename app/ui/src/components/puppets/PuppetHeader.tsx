import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import { useApi, type UiPuppetState } from "../../context/ApiStateContext";
import { Icons } from "../icons/Icons";
import { Button } from "../button/Button";
import { FillStyle } from "../../common/types/variants";
import { Dropdown, type DropdownItem } from "../dropdown/Dropdown";
import { EntityHeader } from "../entityHeader/EntityHeader";
import { StatusPill } from "../pill/statusPill/StatusPill";
import { ViewPicker } from "../pickers/ViewPicker";
import { DEFAULT_ENTITY_COLOR } from "../../common/appearance";

export function PuppetHeader({ puppet }: { puppet: UiPuppetState }): JSX.Element {
  const { state } = useApi();
  const [assignOpen, setAssignOpen] = useState(false);

  const views = state ? [...state.views.values()] : [];

  const menu: DropdownItem[] = puppet.assignedView
    ? [{ id: "unassign", label: "Unassign view", onClick: () => void puppet.unassignView() }] // TODO: Should this be here? 
    : []; // TODO: Editor

  return (
    <>
      <EntityHeader
        icon={<Icons.screen />}
        color={DEFAULT_ENTITY_COLOR}
        title={puppet.config.name.long}
        subtitle={puppet.config.name.short}
        chips={<StatusPill status={puppet.info.state} />}
        actions={
          <>
            <Button onClick={() => setAssignOpen(true)} fillStyle={FillStyle.FILLED}>
              <Icons.installDesktop />
              <span>Assign view</span>
            </Button>
            {menu.length > 0 && (
              <Dropdown ariaLabel="More actions" trigger={<Icons.more />} items={menu} />
            )}
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
