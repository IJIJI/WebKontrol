import { type JSX } from "react";
import { Link } from "react-router-dom";

import "./listItem.less";
import { type CollectionItemProps } from "../types";
import { FrameBox } from "../../frameBox/FrameBox";
import { Icons } from "../../icons/Icons";
import { ItemActions } from "../ItemActions";

export function ListItem(props: CollectionItemProps): JSX.Element {
  const inner = (
    <>
      <FrameBox color={props.color} className="icon">
        {props.icon ?? <Icons.burger />}
      </FrameBox>
      <div className="info">
        <span className="title">{props.title}</span>
        {props.chips && <div className="chips">{props.chips}</div>}
      </div>
    </>
  );

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
