import { type JSX } from "react/jsx-runtime";
import { Collection } from "../components/collections/Collection";
import { CollectionLayout } from "../components/collections/types";
import { Button } from "../components/button/Button";
import { ListItem } from "../components/collections/items/ListItem";

export default function DashboardPage(): JSX.Element {
  return (
    <Collection
      items={[]}
      getKey={(v) => "1"}
      layout={CollectionLayout.LIST}
      title="Dashboard"
      actions={[]}
      renderItem={(v) => (
        <ListItem to={"/"} title={""} icon={""} color={"#FF0000"} actions={[]} />
      )}
    />
  ); 
}
