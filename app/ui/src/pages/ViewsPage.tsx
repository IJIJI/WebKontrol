import { type JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";

import { Collection } from "../components/collections/Collection";
import { CollectionLayout } from "../components/collections/types";
import { Icons } from "../components/icons/Icons";
import { ViewTypeChip } from "../components/views/ViewTypeChip";
import { type UiViewState, useApi } from "../context/ApiStateContext";
import { AssignViewModal } from "../components/views/AssignViewModal";
import { ShareViewModal } from "../components/views/ShareViewModal";
import { useState } from "react";
import { ViewStatusPill } from "../components/views/ViewStatusPill";
import { Icon } from "../components/icons/Icon";

// TODO: Rename to ViewCollectionpage
export default function ViewsPage(): JSX.Element {
  const navigate = useNavigate();
  const { state } = useApi();

  const views = state ? [...state.views.values()] : [];

  const puppets = state ? [...state.puppets.values()] : [];

  const [selectedView, setSelectedView] = useState<UiViewState | undefined>(undefined);
  const [shareView, setShareView] = useState<UiViewState | undefined>(undefined);

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
          icon: <Icon id={v.appearance.icon} />,
          color: v.appearance.color,
          chips: <>
                <ViewTypeChip type={v.config.type} />
                <ViewStatusPill view={v} collapsed={false} />
              </>, // TODO: Status pill always collapsed?
                   // TODO: Auto collapse all pills on mobile?
          actions: [
            {
              id: "share",
              label: "Share",
              icon: <Icons.share />,
              onClick: () => setShareView(v),
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
    <ShareViewModal
      open={shareView != undefined}
      onClose={() => setShareView(undefined)}
      view={shareView}
    />
    </>
  );
}