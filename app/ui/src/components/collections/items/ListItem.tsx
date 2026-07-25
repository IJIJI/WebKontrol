import { type JSX } from "react";
import { Link } from "react-router-dom";
import { type CollectionItemProps } from "../types";
import { FrameBox } from "../../frameBox/FrameBox";
import { Icons } from "../../icons/Icons";
import { Button } from "../../button/Button";

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

      {props.actions?.length ? (
        <div className="actions">
          {props.actions.map((a) => (
            <Button
              key={a.id}
              onClick={a.onClick}
              type={a.type}
              style={a.style}
              disabled={a.disabled}
              ariaLabel={a.label}
            >
              {a.icon}
              <span className="label">{a.label}</span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
