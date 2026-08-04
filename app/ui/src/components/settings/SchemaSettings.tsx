import { type JSX } from "react/jsx-runtime";

import { type FieldMeta } from "../../../../src/views/types/schema";
import { describeField, objectFields, type FieldInfo, type FieldKind } from "./zodField";
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

/**
 * Escape hatch for field kinds this generic mapper does not know about. Tried before the built-in
 * widgets (so it can override them) and applied at every nesting depth; return null to fall
 * through. Keeps domain-specific fields, block slots for one, out of the shared mapper.
 * `path` is the field's enclosing object keys relative to the schema root ([] at the top level),
 * so a custom renderer can address nested fields without walking the schema itself.
 */
export type CustomFieldRenderer = (
  key: string,
  info: FieldInfo,
  lens: DraftLens,
  path: readonly string[],
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
    // flat fields (and custom widgets) share one group; each top-level object field is its own
    // sibling section (deeper objects render inline inside it). Advanced folds away regardless.
    const custom = renderCustom?.(key, info, draft, []);
    const isSection = !custom && info.kind === "object";
    const element =
      custom ??
      (isSection
        ? objectGroup(key, info, meta, draft, renderCustom, [], joined)
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

// One field: a caller's custom renderer if it claims the field, else a nested group for plain
// objects, else a Setting widget.
function fieldElement(
  key: string,
  info: FieldInfo,
  meta: FieldMeta,
  lens: DraftLens,
  placeholder: string | undefined,
  renderCustom: CustomFieldRenderer | undefined,
  path: readonly string[],
  joined: boolean,
): JSX.Element {
  const custom = renderCustom?.(key, info, lens, path);
  if (custom) return custom;
  if (info.kind === "object") return objectGroup(key, info, meta, lens, renderCustom, path, joined);
  return renderField(key, info.kind, info.options, meta, lens, placeholder);
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
  path: readonly string[],
  joined: boolean,
): JSX.Element {
  const sub = subLens(lens, key);
  const children = objectFields(info.core).flatMap(([k, fieldSchema]) => {
    const i = describeField(fieldSchema);
    if (!i.meta) return [];
    const placeholder = i.meta.placeholder ?? defaultPlaceholder(i);
    return [fieldElement(k, i, i.meta, sub, placeholder, renderCustom, [...path, key], joined)];
  });
  return (
    <CollapsibleGroup key={key} title={meta.label} defaultOpen joined={joined}>
      {children}
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
