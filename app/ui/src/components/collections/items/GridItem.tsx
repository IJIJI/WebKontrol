import { type JSX } from "react/jsx-runtime";
import { Link } from "react-router-dom";

import "./gridItem.less";
import { type CollectionItemProps } from "../types";
import { FrameBox } from "../../frameBox/FrameBox";
import { Icons } from "../../icons/Icons";
import { ItemActions } from "../ItemActions";

// A card-shaped collection item. Selectable (a button, used by pickers) when `onSelect` is set; a
// link when `to` is set; otherwise a static card.
export function GridItem(props: CollectionItemProps): JSX.Element {
  const inner = (
    <>
      <FrameBox color={props.color} className="icon">
        {props.icon ?? <Icons.burger />}
      </FrameBox>
      <span className="title" title={typeof props.title === "string" ? props.title : undefined}>
        {props.title}
      </span>
    </>
  );

  if (props.onSelect) {
    return (
      <button
        type="button"
        className={"gridItem selectable" + (props.selected ? " selected" : "")}
        aria-pressed={props.selected ?? false}
        onClick={props.onSelect}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="item gridItem">
      {props.to ? (
        <Link to={props.to} className="cardMain clickable" aria-label={props.label}>
          {inner}
        </Link>
      ) : (
        <div className="cardMain">{inner}</div>
      )}
      <ItemActions actions={props.actions} />
    </div>
  );
}
