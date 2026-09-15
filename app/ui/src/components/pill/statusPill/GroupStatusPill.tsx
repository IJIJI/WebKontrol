import { type MouseEvent, type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";
import { Link, type To } from "react-router-dom";

import "./groupStatusPill.less";
import { type ConnectionState } from "../../../../../src/types/CommonTypes";
import { GroupChipPill } from "../GroupChipPill";
import { StatusDot } from "./StatusDot";
import { STATUS_META } from "./statusMeta";

export interface StatusItem {
  id: string;
  name: string;
  status: ConnectionState;
  text?: string; // Defaults to the ConnectionState's label.
  to?: To; // Renders the row as a link.
  state?: unknown; // Router state for `to` (e.g. { back: ... }).
  onClick?: () => void;
}

export function GroupStatusPill({
  items,
  children,
}: {
  items: StatusItem[];
  children: ReactNode;
}): JSX.Element {
  // Nothing to reveal → just the plain pill, no hover attached.
  if (items.length === 0) return <>{children}</>;

  return (
    <GroupChipPill
      content={
        <ul className="statusList">
          {items.map((item) => {
            const meta = STATUS_META[item.status];
            const row = (
              <>
                <StatusDot variant={meta.variant} />
                <span className="statusRowName">{item.name}</span>
                <span className="statusRowText">{item.text ?? meta.label}</span>
              </>
            );
            // Stop propagation so a row click doesn't reach the Popover anchor and toggle its pin.
            const onClick = (e: MouseEvent): void => {
              e.stopPropagation();
              item.onClick?.();
            };
            return (
              <li key={item.id}>
                {item.to ? (
                  <Link className="statusRow clickable" to={item.to} state={item.state} onClick={onClick}>
                    {row}
                  </Link>
                ) : item.onClick ? (
                  <button type="button" className="statusRow clickable" onClick={onClick}>
                    {row}
                  </button>
                ) : (
                  <div className="statusRow">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      }
    >
      {children}
    </GroupChipPill>
  );
}
