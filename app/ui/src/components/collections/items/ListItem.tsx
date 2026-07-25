import { JSX, ReactNode } from "react";
import { Link } from "react-router-dom";
import { CollectionItemProps } from "../types";
import { FrameBox } from "../../frameBox/FrameBox";
import { Icons } from "../../icons/Icons";
import { Button } from "../../button/Button";

import "./listItem.less";

export function ListItem(props: CollectionItemProps): JSX.Element {
  const baseClass = ["list"];
  
  const mainWrap = (content: ReactNode): JSX.Element => props.to ? // TODO: This is here for more dynamic wrapping of main link items, check how the wrapping could be improved.
    <Link to={props.to} className={[...baseClass, "main", "clickable"].filter(Boolean).join(" ")} aria-label={props.label}>{content}</Link>
    :
    <div className={[...baseClass, "main"].filter(Boolean).join(" ")} >{content}</div>
  
    return (
    <div
      className={[...baseClass].filter(Boolean).join(" ")}
    >
      {mainWrap(
        <>
          <FrameBox color={props.color} className={[...baseClass, "icon"].filter(Boolean).join(" ")} >
            {props.icon ? props.icon : <Icons.burger /> }
          </FrameBox>
          <div className={[...baseClass, "info"].filter(Boolean).join(" ")} >
            <span className={[...baseClass, "title"].filter(Boolean).join(" ")} >
              { props.title }
            </span>
            <div className={[...baseClass, "chips"].filter(Boolean).join(" ")} >
              { props.chips }
            </div>
          </div>
        </>
      )}
      {props.actions?.length ?
      <div className={[...baseClass, "actions"].filter(Boolean).join(" ")}>
        {props.actions.map((a) => (
          <Button
            key={a.id}
            onClick={a.onClick}
            type={a.type}
            style={a.style}
            disabled={a.disabled}
            ariaLabel={a.label}
            className={[...baseClass, "action"].filter(Boolean).join(" ")}
          >
            {a.icon}
            <span className={[...baseClass, "action", "label"].filter(Boolean).join(" ")}>
              {a.label}
            </span>
          </Button>
        ))}
      </div>
      : null }
    </div>
  );
}