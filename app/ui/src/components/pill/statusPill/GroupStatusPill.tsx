import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

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
            return (
              <li key={item.id} className="statusRow">
                <StatusDot variant={meta.variant} />
                <span className="statusRowName">{item.name}</span>
                <span className="statusRowText">{item.text ?? meta.label}</span>
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
