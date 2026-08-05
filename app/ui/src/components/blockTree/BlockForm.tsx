import { type JSX } from "react/jsx-runtime";
import type { ZodObject, ZodRawShape, ZodType } from "zod";

import { isBlockSlot } from "../../../../src/views/blocks/types/schema";
import { unwrap } from "../../../../src/views/blocks/resolver";
import { SchemaSettings, type CustomFieldRenderer, type DraftLens } from "../settings/SchemaSettings";
import {
  Caret,
  DetailGroup,
  DetailRow,
  InlineValue,
  countLabel,
  summaryToken,
  useDisclosure,
} from "../settings/SchemaDetails";
import { describeField, objectFields } from "../settings/zodField";
import { BlockChip } from "./presentation/BlockChip";
import { BlockSlotListSetting, BlockSlotSetting } from "./editor/BlockSlotSetting";
import { blockDef } from "./model/registry";
import { type BlockLike, type BlockPath, getAtPath, isBlock } from "./model/blockUtils";

/**
 * One block's config, driven by its registered schema. Editable when `setAt` is given, inspection
 * only when it isn't. The same walk and the same labels either way, which is why the read-only
 * view knows a field is called "Font size" rather than `fontSize`.
 *
 * Block slots are claimed from the generic mapper by the slot settings; everything else is
 * rendered by SchemaSettings' own widgets.
 */
export function BlockForm({
  block,
  savedBlock,
  path,
  setAt,
  onOpen,
}: {
  block: BlockLike;
  savedBlock?: BlockLike;
  path: BlockPath;
  /** Write a value at an absolute tree path. Omit for a read-only form. */
  setAt?: (target: BlockPath, value: unknown) => void;
  onOpen: (path: BlockPath) => void;
}): JSX.Element {
  const readOnly = setAt === undefined;
  const def = blockDef(block.type);
  if (!def) {
    return (
      <div className="empty">
        Unknown block type “{block.type}”. It may come from a plugin that is not installed.
      </div>
    );
  }

  const lens: DraftLens = {
    values: block,
    saved: savedBlock ?? {},
    setField: (key, value) => setAt?.([...path, key], value),
  };

  // Writes go through the field's own lens (correct at any nesting depth); opening a child block
  // needs its absolute tree path, built from this block's path + the field's relative path.
  // Inspection renders detail markup instead of Setting rows, so slots match the property list
  // around them rather than sitting in it as form cards.
  const renderCustom: CustomFieldRenderer = (key, info, fieldLens, relPath) => {
    const core = unwrap(info.core as ZodType);
    const label = info.meta?.label ?? key;
    const childBase: BlockPath = [...path, ...relPath, key];
    const value = fieldLens.values[key];

    if (isBlockSlot(core)) {
      const child = isBlock(value) ? value : undefined;
      if (readOnly) {
        return (
          <DetailRow key={key} label={label}>
            {child ? (
              <BlockChip type={child.type} onClick={() => onOpen(childBase)} />
            ) : (
              <span className="scalar muted">empty</span>
            )}
          </DetailRow>
        );
      }
      return (
        <BlockSlotSetting
          key={key}
          title={label}
          subtitle={info.meta?.description}
          value={value}
          onChange={(next) => fieldLens.setField(key, next)}
          onOpen={() => onOpen(childBase)}
        />
      );
    }

    if (isArrayOfSlots(core)) {
      if (readOnly) {
        return (
          <ArrayDetail key={key} label={label} value={value} elementCore={undefined}
            defaultOpen={relPath.length === 0}
            onOpenAt={(rest) => onOpen([...childBase, ...rest])} />
        );
      }
      return (
        <BlockSlotListSetting
          key={key}
          title={label}
          subtitle={info.meta?.description}
          value={value}
          onChange={(next) => fieldLens.setField(key, next)}
          onOpen={(index) => onOpen([...childBase, index])}
        />
      );
    }

    // Inspection of any other array (freeform's wrapper items): the old inspector's presentation,
    // block headline + folded summary per item. Editing falls through to the generic mapper.
    if (readOnly && info.kind === "array") {
      const element = (info.core as { element?: unknown }).element;
      return (
        <ArrayDetail key={key} label={label} value={value}
          elementCore={element === undefined ? undefined : describeField(element).core}
          defaultOpen={relPath.length === 0}
          onOpenAt={(rest) => onOpen([...childBase, ...rest])} />
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
      readOnly={readOnly}
    />
  );
}

/** The same block in the saved tree, for per-field "changed" marks. */
export function savedBlockAt(
  saved: BlockLike | undefined,
  path: BlockPath,
  type: string,
): BlockLike | undefined {
  if (!saved) return undefined;
  const at = getAtPath(saved, path);
  // Only a same-typed block counts: after a structural edit the saved path can hold a different
  // block, whose field values would be nonsense as restore targets.
  return isBlock(at) && at.type === type ? at : undefined;
}

function isArrayOfSlots(core: unknown): boolean {
  const element = (core as { element?: unknown }).element;
  return element !== undefined && isBlockSlot(unwrap(element as ZodType));
}

//* Read-only presentation of array fields, mirroring the old inspector: items sit flat at the
//* array's level; a block is a chip, a wrapper object folds behind its block headline, a scalar
//* is its text.

// Field labels for a wrapper's rows, from the element schema's meta (raw key as fallback).
function labelMap(elementCore: unknown): Map<string, string> {
  const labels = new Map<string, string>();
  if (elementCore === undefined) return labels;
  for (const [key, fieldSchema] of objectFields(elementCore)) {
    const label = describeField(fieldSchema).meta?.label;
    if (label !== undefined) labels.set(key, label);
  }
  return labels;
}

function ArrayDetail({
  label,
  value,
  elementCore,
  defaultOpen,
  onOpenAt,
}: {
  label: string;
  value: unknown;
  elementCore: unknown;
  defaultOpen: boolean;
  onOpenAt: (rest: (string | number)[]) => void;
}): JSX.Element {
  const raw: unknown[] = Array.isArray(value) ? value : [];
  const labels = labelMap(elementCore);

  return (
    <DetailGroup label={label} count={countLabel(raw.length, "item")} flat defaultOpen={defaultOpen}>
      {raw.map((item, index) => {
        if (isBlock(item)) {
          return (
            <div className="sub" key={index}>
              <BlockChip type={item.type} onClick={() => onOpenAt([index])} />
            </div>
          );
        }
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          return (
            <WrapperItem
              key={index}
              entries={Object.entries(item as Record<string, unknown>)}
              labels={labels}
              onOpenBlock={(fieldKey) => onOpenAt([index, fieldKey])}
            />
          );
        }
        return (
          <div className="sub" key={index}>
            <span className="scalar">{summaryToken(item)}</span>
          </div>
        );
      })}
    </DetailGroup>
  );
}

// An array element that is an object. Its single block field (if any) is the "main" field: it
// becomes the clickable headline, the rest fold behind a summary and expand to labelled rows.
// With no single block field there is no headline, the whole thing expands from its summary.
function WrapperItem({
  entries,
  labels,
  onOpenBlock,
}: {
  entries: [string, unknown][];
  labels: Map<string, string>;
  onOpenBlock: (fieldKey: string) => void;
}): JSX.Element {
  const { open, toggle } = useDisclosure(false);
  const blockEntries = entries.filter(([, v]) => isBlock(v));
  const mainEntry = blockEntries.length === 1 ? blockEntries[0] : null;
  const mainBlock = mainEntry === null ? null : (mainEntry[1] as BlockLike);
  const restEntries = mainEntry === null ? entries : entries.filter((e) => e !== mainEntry);
  const expandable = restEntries.length > 0;
  const summary =
    mainEntry === null
      ? entries.map(([k, v]) => `${k}: ${summaryToken(v)}`).join(" · ")
      : restEntries.map(([, v]) => summaryToken(v)).join(" · ");

  return (
    <div className="wrapItem">
      <div className="wrapHead">
        {mainBlock !== null && mainEntry !== null && (
          <BlockChip type={mainBlock.type} onClick={() => onOpenBlock(mainEntry[0])} />
        )}
        {expandable && (
          <button
            type="button"
            className="wrapToggle"
            aria-label="Toggle fields"
            aria-expanded={open}
            onClick={toggle}
          >
            {!open && summary && <span className="wrapSummary">{summary}</span>}
            <Caret open={open} />
          </button>
        )}
      </div>
      {open && (
        <div className="wrapBody">
          {restEntries.map(([k, v]) => (
            <DetailRow key={k} label={labels.get(k) ?? k}>
              <InlineValue value={v} />
            </DetailRow>
          ))}
        </div>
      )}
    </div>
  );
}
