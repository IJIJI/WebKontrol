import { type JSX } from "react/jsx-runtime";

import "./blockDetail.less";
import { type BlockLike } from "../model/blockUtils";
import { SelectProvider, type BlockSelect } from "./selectContext";
import { Field } from "./nodes";

// The selected block's config as a sectioned property list. Objects/arrays collapse; nested blocks
// are references that re-select. The block itself is not shown as a root (its identity lives in the
// pane header).
export function BlockDetail({
  block,
  onSelect,
}: {
  block: BlockLike;
  onSelect: BlockSelect;
}): JSX.Element {
  const fields = Object.entries(block).filter(([key]) => key !== "type");

  return (
    <SelectProvider onSelect={onSelect}>
      <div className="blockDetail">
        {fields.length === 0 ? (
          <div className="empty">No fields</div>
        ) : (
          fields.map(([key, value]) => (
            <div key={key} className="section">
              <Field name={key} value={value} depth={0} />
            </div>
          ))
        )}
      </div>
    </SelectProvider>
  );
}
