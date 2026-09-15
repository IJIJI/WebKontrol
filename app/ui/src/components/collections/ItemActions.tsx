import { type JSX } from "react";
import { Button } from "../button/Button";
import { type ItemAction } from "./types";

// Renders a declarative ItemAction[] as a row of buttons. Shared by collection items
// (ListItem) and the collection toolbar, so "add another action" is just another array entry.
export function ItemActions({ actions }: { actions?: ItemAction[] }): JSX.Element | null {
  if (!actions?.length) return null;
  return (
    <div className="actions">
      {actions.map((a) => (
        <Button
          key={a.id}
          onClick={a.onClick}
          variant={a.variant}
          fillStyle={a.fillStyle}
          disabled={a.disabled}
          ariaLabel={a.label}
        >
          {a.icon}
          <span className="label">{a.label}</span>
        </Button>
      ))}
    </div>
  );
}
