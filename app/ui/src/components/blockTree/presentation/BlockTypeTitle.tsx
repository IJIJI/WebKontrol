import { type JSX } from "react/jsx-runtime";

import { blockDef } from "../model/registry";

// A block's type as a colored `namespace › label` breadcrumb: the namespace segment of its key
// plus the registry label. Unregistered types show their raw key without a namespace part.
export function BlockTypeTitle({ type }: { type: string }): JSX.Element {
  const def = blockDef(type);
  return (
    <span className="blockTypeTitle" title={type}>
      {def && (
        <>
          <span className="ns">{def.key.split("::")[0]}</span>
          <span className="sep">›</span>
        </>
      )}
      <span className="name">{def?.info.label ?? type}</span>
    </span>
  );
}
