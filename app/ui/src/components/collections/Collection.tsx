



import { type JSX } from "react/jsx-runtime";
import "./collection.less";
import { CollectionLayout, type CollectionProps } from "./types";
import { ListLayout } from "./layouts/ListLayout";

export function Collection<T>( props: CollectionProps<T> ): JSX.Element {
  const baseClass = ["collection"];
  
  return (
    <section className={[...baseClass].filter(Boolean).join(" ")} >
      {(props.title || props.actions) && (
        <header className={[...baseClass, "toolbar"].filter(Boolean).join(" ")} >
          {props.title && <h2 className={[...baseClass, "title"].filter(Boolean).join(" ")} >{props.title}</h2>}
          {props.actions && <div className={[...baseClass, "actions"].filter(Boolean).join(" ")} >{props.actions}</div>}
        </header>
      )}
      {props.items.length === 0 ?
        <div className={[...baseClass, "empty"].filter(Boolean).join(" ")} >
          {props.empty ?? "Nothing here yet."}
        </div> 
        :
        renderLayout(props)
      }
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