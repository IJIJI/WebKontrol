import { type JSX } from "react/jsx-runtime";

import { blockTypeParts } from "../model/blockUtils";

// A block's type as a colored `namespace › name` breadcrumb. The namespace is dropped when the
// key has no recognisable namespace.
export function BlockTypeTitle({ type }: { type: string }): JSX.Element {
  const { namespace, name } = blockTypeParts(type);
  return (
    <span className="blockTypeTitle">
      {namespace !== null && (
        <>
          <span className="ns">{namespace}</span>
          <span className="sep">›</span>
        </>
      )}
      <span className="name">{name}</span>
    </span>
  );
}
