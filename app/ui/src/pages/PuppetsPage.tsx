import { type JSX } from "react/jsx-runtime";

import { Collection } from "../components/collections/Collection";
import { CollectionLayout } from "../components/collections/types";
import { Icons } from "../components/icons/Icons";
import { Icon } from "../components/icons/Icon";
import { StatusPill } from "../components/pill/statusPill/StatusPill";
import { type UiPuppetState, useApi } from "../context/ApiStateContext";
import { resolvePuppetAppearance } from "../common/appearance";
import { ViewChip } from "../components/views/ViewChip";
import { ViewPicker } from "../components/pickers/ViewPicker";
import { useState } from "react";

export default function PuppetsPage(): JSX.Element {
  const { state } = useApi();
  const puppets = state ? [...state.puppets.values()] : [];
  const views = state ? [...state.views.values()] : [];

  const [selectedPuppet, setSelectedPuppet] = useState<UiPuppetState | undefined>(undefined);

  return (
    <>
      <Collection
        items={puppets}
        getKey={(p) => p.config.id}
        layout={CollectionLayout.LIST}
        title="Puppets"
        empty="No puppets configured."
        renderItem={(p) => {
          const appearance = resolvePuppetAppearance(p.appearance);
          const assignedView = p.assignedView ? state?.views.get(p.assignedView) : undefined;
          return {
          to: `/puppets/${p.config.id}`,
          title: p.config.name.long,
          icon: <Icon id={appearance.icon} />,
          color: appearance.color,
          chips: (
            <>
              <StatusPill status={p.info.state} />
              {assignedView && <ViewChip view={assignedView} />}
            </>
          ),
          actions: [
            {
              id: "assign",
              label: "Assign",
              icon: <Icons.installDesktop />,
              onClick: () => {
                void setSelectedPuppet(p);
              },
            },
          ]
        };
        }}
      />
      <ViewPicker
        open={selectedPuppet != undefined}
        onClose={() => setSelectedPuppet(undefined)}
        views={views}
        title={
          <span>
            Assign view to{" "}
            <b>
              <code>{selectedPuppet?.config.name.long}</code>
            </b>
          </span>
        }
        confirmLabel="Assign"
        onConfirm={(viewKey) => selectedPuppet?.assignView(viewKey)}
      />
    </>
  );
}
