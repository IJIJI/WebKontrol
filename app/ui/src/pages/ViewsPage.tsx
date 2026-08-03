import { type JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Collection } from "../components/collections/Collection";
import { CollectionLayout } from "../components/collections/types";
import { Icons } from "../components/icons/Icons";
import { ViewTypeChip } from "../components/views/ViewTypeChip";
import { VIEW_TYPE_META } from "../components/views/viewMeta";
import { type UiViewState, useApi } from "../context/ApiStateContext";
import { AssignViewModal } from "../components/views/AssignViewModal";
import { useState } from "react";
import { ViewStatusPill } from "../components/views/ViewStatusPill";
import { Icon } from "../components/icons/Icon";

// Neutral badge colour until views carry their own colour (EntityMeta, #6).
const NEUTRAL_COLOR = "#a3a0a8";

// TODO: Rename to ViewCollectionpage
export default function ViewsPage(): JSX.Element {
  const navigate = useNavigate();
  const { state } = useApi();

  const views = state ? [...state.views.values()] : [];

  const puppets = state ? [...state.puppets.values()] : [];

  const [selectedView, setSelectedView] = useState<UiViewState | undefined>(undefined);

  return (
    <>
    <Collection
      items={views}
      getKey={(v) => v.key}
      layout={CollectionLayout.LIST}
      title="Views"
      empty="Nothing here yet..." // TODO: Add an arrow to the new or a button to make a view.
      actions={[
        { id: "new", label: "New", icon: <Icons.addWindow />, onClick: () => void navigate("/views/new") },
      ]}
      renderItem={(v) => {
        return {
          to: `/views/${v.key}`,
          title: v.config.name.long,
          icon: <Icon id={VIEW_TYPE_META[v.config.type].icon} />,
          color: NEUTRAL_COLOR,
          chips: <> 
                <ViewTypeChip type={v.config.type} />
                <ViewStatusPill view={v} collapsed={false} /> 
              </>, // TODO: Status pill always collapsed?
                   // TODO: Auto collapse all pills on mobile?
          // Both placeholders for now: Share -> share modal (#15), Assign -> puppet-assign modal (#17).
          actions: [
            {
              id: "share",
              label: "Share",
              icon: <Icons.share />,
              onClick: () => void toast("Sharing coming soon"),
            },
            {
              id: "assign",
              label: "Assign",
              icon: <Icons.installDesktop />,
              onClick: () => {
                void setSelectedView(v);
              },
            },
          ],
        };
      }}
    />
    <AssignViewModal
      open={selectedView != undefined}
      onClose={() => setSelectedView(undefined)}
      view={selectedView}
      puppets={puppets}
    />
    </>
  );
}