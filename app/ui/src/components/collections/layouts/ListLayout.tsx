import { type JSX } from "react";
import { type CollectionLayoutProps } from "../types";
import { ListItem } from "../items/ListItem";

// The list container: each item renders as a ListItem (a row) from its props.
export function ListLayout<T>(props: CollectionLayoutProps<T>): JSX.Element {
  return (
    <div className="list">
      {props.items.map((item) => (
        <ListItem key={props.getKey(item)} {...props.renderItem(item)} />
      ))}
    </div>
  );
}
