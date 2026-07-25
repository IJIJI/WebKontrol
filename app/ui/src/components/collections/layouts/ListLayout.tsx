import { Fragment, type JSX } from "react";
import { type CollectionLayoutProps } from "../types";

// The list container. Items are rendered directly via a keyed Fragment, each item is a
// single element: the ListItem's own root, with no extra wrapper div around it.
export function ListLayout<T>(props: CollectionLayoutProps<T>): JSX.Element {
  return (
    <div className="list">
      {props.items.map((item) => (
        <Fragment key={props.getKey(item)}>{props.renderItem(item)}</Fragment>
      ))}
    </div>
  );
}
