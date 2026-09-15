import { type JSX } from "react";
import { Link } from "react-router-dom";

import "./listItem.less";
import { type CollectionItemProps } from "../types";
import { FrameBox } from "../../frameBox/FrameBox";
import { Icons } from "../../icons/Icons";
import { ItemActions } from "../ItemActions";
import { classNames } from "../../../common/helpers/classNames";

// A row-shaped collection item. Selectable (a button, used by pickers) when `onSelect` is set; a
// link when `to` is set; otherwise a static row.
export function ListItem(props: CollectionItemProps): JSX.Element {
  const inner = (
    <>
      {props.icon !== null && (
        <FrameBox color={props.color} className="icon">
          {props.icon ?? <Icons.burger />}
        </FrameBox>
      )}
      <div className="info">
        <span className="title">{props.title}</span>
        {props.chips && <div className="chips">{props.chips}</div>}
      </div>
    </>
  );

  if (props.onSelect) {
    return (
      <button
        type="button"
        className={classNames("item", "selectable", props.selected && "selected")}
        aria-pressed={props.selected ?? false}
        onClick={props.onSelect}
      >
        <div className="main">{inner}</div>
      </button>
    );
  }

  return (
    <div className="item">
      {props.to ? (
        <Link to={props.to} className="main clickable" aria-label={props.label}>
          {inner}
        </Link>
      ) : (
        <div className="main">{inner}</div>
      )}

      <ItemActions actions={props.actions} />
    </div>
  );
}
