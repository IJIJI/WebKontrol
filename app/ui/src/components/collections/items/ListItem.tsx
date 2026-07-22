import { JSX, ReactNode } from "react";
import { Link, To } from "react-router-dom";
import { CollectionItemProps } from "../types";
import { IconBox } from "../../icons/IconBox";


export interface ListRowProps extends CollectionItemProps {
}

export function ListItem(props: ListRowProps): JSX.Element {
  const baseClass = ["collection", "item", "list"];
  
  const mainWrap = (content: ReactNode): JSX.Element => props.to ? // TODO: This is here for more dynamic wrapping of main link items, check how the wrapping could be improved.
    <Link to={props.to} className={[...baseClass, "main", "clickable"].filter(Boolean).join(" ")} aria-label={props.label}>{content}</Link>
    :
    <div className={[...baseClass, "main"].filter(Boolean).join(" ")} aria-label={props.label}>{content}</div>
  
    return (
    <div
      className={[...baseClass].filter(Boolean).join(" ")}
    >
      {mainWrap(
        // TODO: Reactive size?
        <>
          <IconBox color={props.color} size={45} className={[...baseClass, "icon"].filter(Boolean).join(" ")} >
            {props.icon}
          </IconBox>
          <div className={[...baseClass, "info"].filter(Boolean).join(" ")} >
            <h1 className={[...baseClass, "title"].filter(Boolean).join(" ")} >
              {props.label}
            </h1>
            <div className={[...baseClass, "subtitle"].filter(Boolean).join(" ")} >
              // TODO: Chips loading
            </div>
          </div>
        </>
      )}
      <div className={[...baseClass, "actions"].filter(Boolean).join(" ")}>
        {props.actions}
      </div>
    </div>
  );
}