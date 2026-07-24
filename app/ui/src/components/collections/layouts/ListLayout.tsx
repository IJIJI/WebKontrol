import { type JSX } from "react/jsx-runtime";
import { type CollectionLayoutProps } from "../types";






export function ListLayout<T>(props: CollectionLayoutProps<T>): JSX.Element {
  const baseClass = ["collection", "layout", "list"];
  return (
    <div className={[...baseClass].filter(Boolean).join(" ")}>
      {props.items.map((item) => (
        <div key={props.getKey(item)} className={[...baseClass, "item"].filter(Boolean).join(" ")}>
          {props.renderItem(item)}
        </div>
      ))}
    </div>
  );
}