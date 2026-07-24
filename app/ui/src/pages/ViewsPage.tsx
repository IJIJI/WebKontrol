import { type JSX } from "react/jsx-runtime";
import { Collection } from "../components/collections/Collection";
import { ListItem } from "../components/collections/items/ListItem";
import { CollectionLayout, type CollectionItemProps } from "../components/collections/types";
import { Icons } from "../components/icons/Icons";
import { Button, ButtonType } from "../components/button/Button";

// Placeholder data until this is wired to state.views.
type ExampleView = CollectionItemProps & { key: string };

const EXAMPLE_VIEWS: ExampleView[] = [
  {
    key: "lobby",
    to: "/views/lobby",
    title: "Lobby screen",
    icon: <Icons.burger />,
    color: "#4f8cff",
    actions: [
      { id: "open", label: "Open", icon: <Icons.connections />, onClick: () => console.log("open lobby") },
      { id: "delete", label: "Delete", type: ButtonType.DANGER, onClick: () => console.log("delete lobby") },
    ],
  },
  {
    key: "menu",
    to: "/views/menu",
    title: "Menu board",
    icon: <Icons.connections />,
    color: "#22c55e",
    actions: [{ id: "open", label: "Open", onClick: () => console.log("open menu") }],
  },
  {
    key: "alerts",
    to: "/views/alerts",
    title: "Alerts display",
    icon: <Icons.warning />,
    color: "#f59e0b",
    actions: [],
  },
];

export default function ViewsPage(): JSX.Element {
  return (
    <Collection
      items={EXAMPLE_VIEWS}
      getKey={(v) => v.key}
      layout={CollectionLayout.LIST}
      title="Views"
      actions={[
        <Button onClick={() => alert("test")} >Test</Button>
      ]}
      renderItem={(v) => (
        <ListItem to={v.to} title={v.title} icon={v.icon} color={v.color} actions={v.actions} />
      )}
    />
  );
}
