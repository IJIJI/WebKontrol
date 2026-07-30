import { type ReactNode } from "react";

import { type ConfigValue } from "../model/configValue";
import { BlockChip } from "../presentation/BlockChip";
import { type BlockSelect } from "./selectContext";

// The inline representation of a non-group value (sits on the right of a field row). Groups never
// reach here, they render as their own collapsible.
export function inlineValue(cv: ConfigValue, select: BlockSelect): ReactNode {
  switch (cv.kind) {
    case "block":
      return <BlockChip type={cv.block.type} onClick={() => select(cv.block)} />;
    case "scalar":
    case "coordinate":
    case "scalarArray":
      return <span className="scalar">{cv.text}</span>;
    case "emptyArray":
      return <span className="scalar muted">[ ]</span>;
    case "emptyObject":
      return <span className="scalar muted">{"{ }"}</span>;
    case "array":
    case "object":
      return null;
  }
}
