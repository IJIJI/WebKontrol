import { useMemo, useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "../blockExplorer.less";
import { Button } from "../../button/Button";
import { FillStyle, Variant } from "../../../common/types/variants";
import { Icons } from "../../icons/Icons";
import { BlockTree } from "../tree/BlockTree";
import { BlockPane } from "../presentation/BlockPane";
import { BlockForm, savedBlockAt } from "../BlockForm";
import { BlockPicker } from "./BlockPicker";
import { fieldErrors, validateBlockTree } from "../model/validate";
import {
  type BlockLike,
  type BlockPath,
  getAtPath,
  isBlock,
  parentBlockPath,
  pathKey,
  removeAtPath,
  setAtPath,
} from "../model/blockUtils";

/**
 * Edits a block tree: the tree on the left for navigation, the selected block's generated config
 * form in the floating pane. Every edit rebuilds the tree immutably and hands the whole new root
 * up, so the page keeps one draft field for the entire tree.
 */
export function BlockEditor({
  root,
  saved,
  onChange,
}: {
  root: BlockLike | undefined;
  saved: BlockLike | undefined;
  onChange: (root: BlockLike | undefined) => void;
}): JSX.Element {
  // Null = pane closed (like the read-only explorer); [] = the root block selected.
  const [selectedPath, setSelectedPath] = useState<BlockPath | null>(null);
  const [pickingRoot, setPickingRoot] = useState(false);
  // Live validation: derived from the current tree, so there is no stale error state to clear.
  // Above the early return, since hooks must run in the same order every render.
  const issues = useMemo(() => validateBlockTree(root), [root]);

  // Nothing to show or navigate until there is a root block.
  if (!root) {
    return (
      <div className="blockEditor empty">
        <Button fillStyle={FillStyle.FILLED} onClick={() => setPickingRoot(true)}>
          <Icons.add size={16} />
          <span>Pick a root block</span>
        </Button>
        <BlockPicker
          open={pickingRoot}
          onClose={() => setPickingRoot(false)}
          onPick={(type) => {
            onChange({ type });
            setSelectedPath([]);
          }}
          title="Choose a root block"
        />
      </div>
    );
  }

  const at = selectedPath !== null ? getAtPath(root, selectedPath) : undefined;
  // An edit can drop the selected block (cleared slot, removed list item); close the pane then.
  const selected = isBlock(at) ? at : null;
  const path = selected && selectedPath !== null ? selectedPath : [];
  const parentPath = selected ? parentBlockPath(root, path) : null;

  const setAt = (target: BlockPath, value: unknown): void =>
    onChange(setAtPath(root, target, value) as BlockLike);

  const removeSelected = (): void => {
    if (path.length === 0) {
      setSelectedPath(null);
      return onChange(undefined); // removing the root empties the view
    }
    setSelectedPath(parentPath ?? null);
    onChange(removeAtPath(root, path) as BlockLike);
  };

  return (
    <div className="blockEditor">
      <BlockTree
        root={root}
        onSelect={setSelectedPath}
        selected={selectedPath ?? undefined}
        // Unsaved = no same-typed block at this path in the saved tree (new, or replaced).
        isUnsaved={(blockPath, block) => savedBlockAt(saved, blockPath, block.type) === undefined}
        invalidAt={(blockPath) => issues.get(pathKey(blockPath))?.[0]?.message}
      />

      {selected && (
        <BlockPane
          type={selected.type}
          onParent={parentPath ? () => setSelectedPath(parentPath) : undefined}
          onClose={() => setSelectedPath(null)}
          actions={
            <Button
              fillStyle={FillStyle.SKELETON}
              variant={Variant.DANGER}
              onClick={removeSelected}
              ariaLabel={path.length === 0 ? "Remove the root block" : "Remove this block"}
            >
              <Icons.delete size={16} />
            </Button>
          }
        >
          <BlockForm
            block={selected}
            savedBlock={savedBlockAt(saved, path, selected.type)}
            path={path}
            setAt={setAt}
            onOpen={setSelectedPath}
            errors={fieldErrors(issues, path)}
          />
        </BlockPane>
      )}
    </div>
  );
}
