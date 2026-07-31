import { Fragment, type JSX } from "react";
import { type CollectionLayoutProps } from "../types";

// The grid container: items flow into responsive columns (see .grid in gridItem.less). Like
// ListLayout, the item element itself comes from the consumer's renderItem.
export function GridLayout<T>(props: CollectionLayoutProps<T>): JSX.Element {
  return (
    <div className="grid">
      {props.items.map((item) => (
        <Fragment key={props.getKey(item)}>{props.renderItem(item)}</Fragment>
      ))}
    </div>
  );
}
