import { type JSX } from "react/jsx-runtime";

import { type FieldMeta } from "../../../../src/views/types/schema";
import { describeField, objectFields, type FieldInfo, type FieldKind } from "./zodField";
import { Button } from "../button/Button";
import { Icons } from "../icons/Icons";
import { FillStyle, Variant } from "../../common/types/variants";
import { CollapsibleGroup } from "./CollapsibleGroup";
import { TextSetting } from "./implementations/TextSetting";
import { UrlSetting } from "./implementations/UrlSetting";
import { NumberSetting } from "./implementations/NumberSetting";
import { ToggleSetting } from "./implementations/ToggleSetting";
import { SelectSetting } from "./implementations/SelectSetting";
import { BaseSetting } from "./BaseSetting";
import type { ZodObject, ZodRawShape } from "zod";
import { SettingGroup } from "./SettingGroup";

type Values = Record<string, unknown>;

// The slice of a Draft the schema mapper needs. A full useDraft satisfies it, and nested object
// fields get a derived lens whose setField writes back into the parent's field, so recursion
// never needs paths, just closures.
export interface DraftLens { // TODO move to useDraft and make it implement it, or something similar.
  values: Values;
  saved: Values;
  setField: (key: string, value: unknown) => void;
}

// A lens focused on one object-valued field of `parent`: reads narrow into that object, and a
// write rebuilds the parent field immutably. Dirty tracking stays with the root useDraft, whose
// deepEqual already compares object values structurally.
function subLens(parent: DraftLens, key: string): DraftLens {
  const values = (parent.values[key] ?? {}) as Values;
  return {
    values,
    saved: (parent.saved[key] ?? {}) as Values,
    setField: (k, v) => parent.setField(key, { ...values, [k]: v }),
  };
}

// A lens focused on one element of an array-valued field: like subLens, but a write rebuilds the
// element and the array around it. `saved` pairs items by index, so after an add/remove the
// per-field changed/restore markers can point at a shifted item — the group-level dirty tracking
// (deepEqual on the whole root) stays correct regardless.
function itemLens(parent: DraftLens, key: string, index: number): DraftLens {
  const array: unknown[] = Array.isArray(parent.values[key]) ? (parent.values[key] as unknown[]) : [];
  const savedArray: unknown[] = Array.isArray(parent.saved[key]) ? (parent.saved[key] as unknown[]) : [];
  const values = (array[index] ?? {}) as Values;
  return {
    values,
    saved: (savedArray[index] ?? {}) as Values,
    setField: (k, v) => {
      const copy = [...array];
      copy[index] = { ...values, [k]: v };
      parent.setField(key, copy);
    },
  };
}

/**
 * Escape hatch for field kinds this generic mapper does not know about. Tried before the built-in
 * widgets (so it can override them) and applied at every nesting depth; return null to fall
 * through. Keeps domain-specific fields, block slots for one, out of the shared mapper.
 * `path` is the field's enclosing object keys (and array indices) relative to the schema root
 * ([] at the top level), so a custom renderer can address nested fields without walking the
 * schema itself.
 */
export type CustomFieldRenderer = (
  key: string,
  info: FieldInfo,
  lens: DraftLens,
  path: readonly (string | number)[],
) => JSX.Element | null;

// Renders Setting components for a zod object schema, driven by each field's FieldMeta and
// wired through a useDraft (or any DraftLens). Fields without meta are skipped (e.g. the `type`
// discriminator); `exclude` skips fields the page renders itself (e.g. name, in the top row).
// Advanced fields (meta.advanced) fold into a collapsible section, omitted entirely when there
// are none. Plain nested objects render as their own collapsible group, recursively.
export function SchemaSettings({
  schema,
  draft,
  exclude = [],
  advancedTitle = "Advanced",
  placeholders = {},
  renderCustom,
  groupTitle = "Type Specific",
  joined = false,
}: {
  schema: ZodObject<ZodRawShape>; // the current view type's member schema (any zod object)
  draft: DraftLens;
  exclude?: string[];
  advancedTitle?: string;
  placeholders?: Record<string, string>; // per-key placeholder overrides (e.g. a runtime default)
  renderCustom?: CustomFieldRenderer;
  groupTitle?: string;
  joined?: boolean; // one divided card per group instead of an island per field
}): JSX.Element {
  const fields: JSX.Element[] = [];
  const sections: JSX.Element[] = [];
  const advanced: JSX.Element[] = [];

  for (const [key, fieldSchema] of objectFields(schema)) {
    if (exclude.includes(key)) continue;
    const info = describeField(fieldSchema);
    const meta = info.meta;
    if (!meta) continue; // no meta => not auto-rendered

    // Placeholder precedence: page-injected (e.g. a runtime default) > static meta placeholder
    // > the field's own schema .default() (only shown for primitive defaults).
    const placeholder = placeholders[key] ?? meta.placeholder ?? defaultPlaceholder(info);

    // Same dispatch as fieldElement, unrolled because the bucket depends on which branch renders:
    // flat fields (and custom widgets) share one group; each top-level object/array field is its
    // own sibling section (deeper ones render inline inside it). Advanced folds away regardless.
    const custom = renderCustom?.(key, info, draft, []);
    const isSection = !custom && (info.kind === "object" || info.kind === "array");
    const element =
      custom ??
      (info.kind === "object"
        ? objectGroup(key, info, meta, draft, renderCustom, [], joined)
        : info.kind === "array"
          ? arrayGroup(key, info, meta, draft, renderCustom, [], joined)
          : renderField(key, info.kind, info.options, meta, draft, placeholder));
    (meta.advanced ? advanced : isSection ? sections : fields).push(element);
  }

  return (
    <>
      {fields.length > 0 && <SettingGroup title={groupTitle} joined={joined}>{fields}</SettingGroup>}
      {sections}
      {advanced.length > 0 && <CollapsibleGroup title={advancedTitle} joined={joined}>{advanced}</CollapsibleGroup>}
    </>
  );
}

// The field's schema .default() as a placeholder string, for primitive defaults only.
function defaultPlaceholder(info: FieldInfo): string | undefined {
  return typeof info.defaultValue === "string" || typeof info.defaultValue === "number"
    ? String(info.defaultValue)
    : undefined;
}

// A new object seeded with each field's schema default/prefault value (shallow), so the editor
// shows the same values a parse would fill instead of empty inputs. Fields without a default
// (e.g. a block slot) stay absent.
function seedFromDefaults(core: unknown): Values {
  const seed: Values = {};
  for (const [key, fieldSchema] of objectFields(core)) {
    const { defaultValue } = describeField(fieldSchema);
    if (defaultValue !== undefined) seed[key] = defaultValue;
  }
  return seed;
}

// One field: a caller's custom renderer if it claims the field, else a nested group for plain
// objects, else an item list for arrays, else a Setting widget.
function fieldElement(
  key: string,
  info: FieldInfo,
  meta: FieldMeta,
  lens: DraftLens,
  placeholder: string | undefined,
  renderCustom: CustomFieldRenderer | undefined,
  path: readonly (string | number)[],
  joined: boolean,
): JSX.Element {
  const custom = renderCustom?.(key, info, lens, path);
  if (custom) return custom;
  if (info.kind === "object") return objectGroup(key, info, meta, lens, renderCustom, path, joined);
  if (info.kind === "array") return arrayGroup(key, info, meta, lens, renderCustom, path, joined);
  return renderField(key, info.kind, info.options, meta, lens, placeholder);
}

// The meta'd fields of one object level (an object field's shape, or one array item), rendered
// through the given lens. Shared by objectGroup and arrayGroup.
function levelFields(
  core: unknown,
  lens: DraftLens,
  renderCustom: CustomFieldRenderer | undefined,
  path: readonly (string | number)[],
  joined: boolean,
): JSX.Element[] {
  return objectFields(core).flatMap(([key, fieldSchema]) => {
    const info = describeField(fieldSchema);
    if (!info.meta) return [];
    const placeholder = info.meta.placeholder ?? defaultPlaceholder(info);
    return [fieldElement(key, info, info.meta, lens, placeholder, renderCustom, path, joined)];
  });
}

// A nested object field as its own collapsible group, open by default (folding is for skipping,
// not hiding, only the Advanced section starts closed). Fields wire through a sub-lens; the
// advanced flag is only honoured at the top level, nested fields render flat.
function objectGroup(
  key: string,
  info: FieldInfo,
  meta: FieldMeta,
  lens: DraftLens,
  renderCustom: CustomFieldRenderer | undefined,
  path: readonly (string | number)[],
  joined: boolean,
): JSX.Element {
  const children = levelFields(info.core, subLens(lens, key), renderCustom, [...path, key], joined);
  return (
    <CollapsibleGroup key={key} title={meta.label} defaultOpen joined={joined}>
      {children}
    </CollapsibleGroup>
  );
}

// An array-of-objects field: its items listed in one collapsible group, each with a small header
// (index + remove) above its fields, and an add button that appends an empty item (the schema's
// defaults/prefaults fill it in). Arrays of anything else fall back to the read-only display.
function arrayGroup(
  key: string,
  info: FieldInfo,
  meta: FieldMeta,
  lens: DraftLens,
  renderCustom: CustomFieldRenderer | undefined,
  path: readonly (string | number)[],
  joined: boolean,
): JSX.Element {
  const element = (info.core as { element?: unknown }).element;
  const elementInfo = element === undefined ? undefined : describeField(element);
  if (elementInfo?.kind !== "object") {
    return renderField(key, "unknown", [], meta, lens, undefined);
  }

  const raw: unknown[] = Array.isArray(lens.values[key]) ? (lens.values[key] as unknown[]) : [];

  const items = raw.map((_, index) => (
    <div className="arrayItem" key={index}>
      <div className="arrayItemHead">
        <span className="label">#{index + 1}</span>
        <Button
          fillStyle={FillStyle.SKELETON}
          variant={Variant.DANGER}
          onClick={() => lens.setField(key, raw.filter((_, j) => j !== index))}
          ariaLabel="Remove item"
        >
          <Icons.delete size={14} />
        </Button>
      </div>
      {levelFields(elementInfo.core, itemLens(lens, key, index), renderCustom, [...path, key, index], joined)}
    </div>
  ));

  return (
    <CollapsibleGroup key={key} title={meta.label} defaultOpen joined={joined}>
      {[
        ...items,
        <div className="arrayAdd" key="add">
          <Button
            fillStyle={FillStyle.FILLED}
            onClick={() => lens.setField(key, [...raw, seedFromDefaults(elementInfo.core)])}
          >
            <Icons.add size={14} />
            <span>Add</span>
          </Button>
        </div>,
      ]}
    </CollapsibleGroup>
  );
}

function renderField(
  key: string,
  kind: FieldKind,
  options: string[],
  meta: FieldMeta,
  draft: DraftLens,
  placeholder: string | undefined,
): JSX.Element {
  const title = meta.label;
  const subtitle = meta.description;
  const value = draft.values[key];
  const saved = draft.saved[key];
  const set = (v: unknown): void => draft.setField(key, v);

  switch (kind) {
    case "url":
      return (
        <UrlSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder}
          value={(value as string) ?? ""} savedVal={saved as string | undefined} setValue={set} />
      );
    case "text":
      return (
        <TextSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder}
          value={(value as string) ?? ""} savedVal={saved as string | undefined} setValue={set} />
      );
    case "number":
      return (
        <NumberSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder}
          value={value as number} savedVal={saved as number | undefined} setValue={set} />
      );
    case "boolean":
      return (
        <ToggleSetting key={key} title={title} subtitle={subtitle}
          value={Boolean(value)} savedVal={saved as boolean | undefined} setValue={set} />
      );
    case "enum":
      return (
        <SelectSetting key={key} title={title} subtitle={subtitle}
          value={(value as string) ?? ""} savedVal={saved as string | undefined} setValue={set}
          options={options.map((o) => ({ label: o, value: o }))} />
      );
    default:
      // record / unknown: no editable widget yet. Show it read-only (label + description +
      // current value) so nothing silently disappears. RecordSetting replaces this in #7.
      return (
        <BaseSetting key={key} title={title} subtitle={subtitle}>
          <span className="readonlyValue">{value === undefined ? "—" : JSON.stringify(value)}</span>
        </BaseSetting>
      );
  }
}
