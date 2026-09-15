import { type JSX } from "react/jsx-runtime";
import { Collection } from "../components/collections/Collection";
import { CollectionLayout } from "../components/collections/types";

export default function DashboardPage(): JSX.Element {
  return (
    <Collection
      items={[]}
      getKey={() => "1"}
      layout={CollectionLayout.LIST}
      title="Dashboard"
      actions={[]}
      renderItem={() => ({ to: "/", title: "", icon: "", color: "#FF0000", actions: [] })}
    />
  ); 
}
