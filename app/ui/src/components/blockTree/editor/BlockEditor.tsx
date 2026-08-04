import { useState } from "react";
import { type JSX } from "react/jsx-runtime";
import type { ZodObject, ZodRawShape, ZodType } from "zod";

import "../blockExplorer.less";
import { isBlockSlot } from "../../../../../src/views/blocks/types/schema";
import { unwrap } from "../../../../../src/views/blocks/resolver";
import { SchemaSettings, type CustomFieldRenderer, type DraftLens } from "../../settings/SchemaSettings";
import { Button } from "../../button/Button";
import { FillStyle, Variant } from "../../../common/types/variants";
import { Icons } from "../../icons/Icons";
import { BlockTree } from "../tree/BlockTree";
import { BlockPane } from "../presentation/BlockPane";
import { BlockPicker } from "./BlockPicker";
import { BlockSlotListSetting, BlockSlotSetting } from "./BlockSlotSetting";
import { blockDef } from "../model/registry";
import {
  type BlockLike,
  type BlockPath,
  getAtPath,
  isBlock,
  parentBlockPath,
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
      <BlockTree root={root} onSelect={setSelectedPath} selected={selectedPath ?? undefined} />

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
            savedBlock={savedAt(saved, path, selected.type)}
            path={path}
            setAt={setAt}
            onOpen={setSelectedPath}
          />
        </BlockPane>
      )}
    </div>
  );
}

/**
 * The same block in the saved tree, for per-field "changed" marks. Only a same-typed block
 * counts: after a structural edit the saved path can hold a different block, whose field values
 * would be nonsense as restore targets.
 */
function savedAt(saved: BlockLike | undefined, path: BlockPath, type: string): BlockLike | undefined {
  if (!saved) return undefined;
  const at = getAtPath(saved, path);
  return isBlock(at) && at.type === type ? at : undefined;
}

// One block's config as a form: the generic schema mapper, with block slots rendered by the
// slot settings (which the mapper knows nothing about) and everything else by its own widgets.
function BlockForm({
  block,
  savedBlock,
  path,
  setAt,
  onOpen,
}: {
  block: BlockLike;
  savedBlock: BlockLike | undefined;
  path: BlockPath;
  setAt: (target: BlockPath, value: unknown) => void;
  onOpen: (path: BlockPath) => void;
}): JSX.Element {
  const def = blockDef(block.type);
  if (!def) {
    return <div className="empty">Unknown block type “{block.type}”. It may come from a plugin that is not installed.</div>;
  }

  const lens: DraftLens = {
    values: block,
    saved: savedBlock ?? {},
    setField: (key, value) => setAt([...path, key], value),
  };

  // Slot fields are claimed here; everything else falls through to the mapper's own widgets.
  // Writes go through the field's lens (correct at any nesting depth); opening a child block
  // needs its absolute tree path, built from this block's path + the field's relative path.
  const renderCustom: CustomFieldRenderer = (key, info, fieldLens, relPath) => {
    const core = unwrap(info.core as ZodType);
    const label = info.meta?.label ?? key;
    const childBase: BlockPath = [...path, ...relPath, key];

    if (isBlockSlot(core)) {
      return (
        <BlockSlotSetting
          key={key}
          title={label}
          subtitle={info.meta?.description}
          value={fieldLens.values[key]}
          onChange={(next) => fieldLens.setField(key, next)}
          onOpen={() => onOpen(childBase)}
        />
      );
    }

    // An array of slots (a grid's children). Arrays of *objects* containing slots (freeform's
    // positioned items) still fall through to the read-only fallback until arrays are supported.
    if (isArrayOfSlots(core)) {
      return (
        <BlockSlotListSetting
          key={key}
          title={label}
          subtitle={info.meta?.description}
          value={fieldLens.values[key]}
          onChange={(next) => fieldLens.setField(key, next)}
          onOpen={(index) => onOpen([...childBase, index])}
        />
      );
    }

    return null;
  };

  return (
    <SchemaSettings
      // configSchema is declared z.ZodType<Config> for callers, but defineBlock always builds it
      // as a z.object, the mapper needs that runtime shape.
      schema={def.configSchema as unknown as ZodObject<ZodRawShape>}
      draft={lens}
      renderCustom={renderCustom}
      groupTitle="Config"
      joined
    />
  );
}

function isArrayOfSlots(core: unknown): boolean {
  const element = (core as { element?: unknown }).element;
  return element !== undefined && isBlockSlot(unwrap(element as ZodType));
}
