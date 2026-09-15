import { type JSX } from "react/jsx-runtime";

import { Collection } from "../components/collections/Collection";
import { CollectionLayout } from "../components/collections/types";
import { Icons } from "../components/icons/Icons";
import { Icon } from "../components/icons/Icon";
import { PuppetStatusPill } from "../components/puppets/PuppetStatusPill";
import { type UiPuppetState, useApi } from "../context/ApiStateContext";
import { resolvePuppetAppearance } from "../common/appearance";
import { ViewChip } from "../components/views/ViewChip";
import { AssignToPuppetModal } from "../components/puppets/AssignToPuppetModal";
import { useState } from "react";

export default function PuppetsPage(): JSX.Element {
  const { state } = useApi();
  const puppets = state ? [...state.puppets.values()] : [];

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
              <PuppetStatusPill info={p.info} />
              {assignedView && <ViewChip view={assignedView} />}
            </>
          ),
          actions: [
            {
              id: "assign",
              label: "Assign",
              icon: <Icons.installDesktop />,
              onClick: () => setSelectedPuppet(p),
            },
          ]
        };
        }}
      />
      <AssignToPuppetModal
        open={selectedPuppet != undefined}
        onClose={() => setSelectedPuppet(undefined)}
        puppet={selectedPuppet}
      />
    </>
  );
}
