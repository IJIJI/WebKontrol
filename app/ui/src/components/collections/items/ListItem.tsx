import { JSX, ReactNode } from "react";
import { Link, To } from "react-router-dom";


export interface ListRowProps {
  // onClick?: () => void; // TODO: Promise support?
  to?: To;
  label?: string;
  actions?: ReactNode;
  children: ReactNode;
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
      {mainWrap(props.children)}
      <div className={[...baseClass, "actions"].filter(Boolean).join(" ")}>
        {props.actions}
      </div>
    </div>
  );
}