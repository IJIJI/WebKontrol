import { type JSX } from "react";
import { type CollectionLayoutProps } from "../types";
import { GridItem } from "../items/GridItem";

// The grid container: items flow into responsive columns (see .grid in gridItem.less), each
// rendered as a GridItem (a card) from its props.
export function GridLayout<T>(props: CollectionLayoutProps<T>): JSX.Element {
  return (
    <div className="grid">
      {props.items.map((item) => (
        <GridItem key={props.getKey(item)} {...props.renderItem(item)} />
      ))}
    </div>
  );
}
