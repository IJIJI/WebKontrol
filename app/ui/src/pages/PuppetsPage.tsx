import { type JSX } from "react/jsx-runtime";

import { Collection } from "../components/collections/Collection";
import { CollectionLayout } from "../components/collections/types";
import { Icons } from "../components/icons/Icons";
import { StatusPill } from "../components/pill/statusPill/StatusPill";
import { useApi } from "../context/ApiStateContext";
import { DEFAULT_ENTITY_COLOR } from "../common/appearance";

export default function PuppetsPage(): JSX.Element {
  const { state } = useApi();
  const puppets = state ? [...state.puppets.values()] : [];

  return (
    <Collection
      items={puppets}
      getKey={(p) => p.config.id}
      layout={CollectionLayout.LIST}
      title="Puppets"
      empty="No puppets connected."
      renderItem={(p) => ({
        to: `/puppets/${p.config.id}`,
        title: p.config.name.long,
        icon: <Icons.screen />,
        color: DEFAULT_ENTITY_COLOR,
        chips: <StatusPill status={p.info.state} />,
      })}
    />
  );
}
