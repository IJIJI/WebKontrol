import { type JSX } from "react/jsx-runtime";
import "./collection.less";
import { CollectionLayout, type CollectionProps } from "./types";
import { ListLayout } from "./layouts/ListLayout";

export function Collection<T>(props: CollectionProps<T>): JSX.Element {
  return (
    <section className="collection">
      {(props.title || props.actions) && (
        <header className="toolbar">
          {props.title && <h2 className="title">{props.title}</h2>}
          {props.actions && <div className="actions">{props.actions}</div>}
        </header>
      )}
      {props.items.length === 0 ? (
        <div className="empty">{props.empty ?? "Nothing here yet."}</div>
      ) : (
        renderLayout(props)
      )}
    </section>
  );
}

function renderLayout<T>(props: CollectionProps<T>): JSX.Element {
  switch (props.layout) {
    case CollectionLayout.LIST:
    default:
      return <ListLayout {...props} />;
    // TODO: More layouts
  }
}
