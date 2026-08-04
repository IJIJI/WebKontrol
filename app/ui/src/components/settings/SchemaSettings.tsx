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

// Renders Setting components for a zod object schema, driven by each field's FieldMeta and
// wired through a useDraft. Fields without meta are skipped (e.g. the `type` discriminator);
// `exclude` skips fields the page renders itself (e.g. name, in the top row). Advanced fields
// (meta.advanced) fold into a collapsible section, omitted entirely when there are none.
export function SchemaSettings({
  schema,
  draft,
  exclude = [],
  advancedTitle = "Advanced",
  placeholders = {},
}: {
  schema: ZodObject<ZodRawShape>; // the current view type's member schema (any zod object)
  draft: DraftLens;
  exclude?: string[];
  advancedTitle?: string;
  placeholders?: Record<string, string>; // per-key placeholder overrides (e.g. a runtime default)
}): JSX.Element {
  const normal: JSX.Element[] = [];
  const advanced: JSX.Element[] = [];

  for (const [key, fieldSchema] of objectFields(schema)) {
    if (exclude.includes(key)) continue;
    const info = describeField(fieldSchema);
    const meta = info.meta;
    if (!meta) continue; // no meta => not auto-rendered

    // Placeholder precedence: page-injected (e.g. a runtime default) > static meta placeholder
    // > the field's own schema .default() (only shown for primitive defaults).
    const placeholder = placeholders[key] ?? meta.placeholder ?? defaultPlaceholder(info);
    const element = fieldElement(key, info, meta, draft, placeholder);
    (meta.advanced ? advanced : normal).push(element);
  }

  return (
    <>
      <SettingGroup title="Type Specific">
        {normal}
      </SettingGroup>
      {advanced.length > 0 && <CollapsibleGroup title={advancedTitle}>{advanced}</CollapsibleGroup>}
    </>
  );
}

// The field's schema .default() as a placeholder string, for primitive defaults only.
function defaultPlaceholder(info: FieldInfo): string | undefined {
  return typeof info.defaultValue === "string" || typeof info.defaultValue === "number"
    ? String(info.defaultValue)
    : undefined;
}

// One field: a nested group for plain objects, a Setting widget for everything else.
function fieldElement(
  key: string,
  info: FieldInfo,
  meta: FieldMeta,
  lens: DraftLens,
  placeholder: string | undefined,
): JSX.Element {
  if (info.kind === "object") return objectGroup(key, info, meta, lens);
  return renderField(key, info.kind, info.options, meta, lens, placeholder);
}

// A nested object field as its own fold-away group, its fields wired through a sub-lens.
// The advanced flag is only honoured at the top level; nested fields render flat.
function objectGroup(key: string, info: FieldInfo, meta: FieldMeta, lens: DraftLens): JSX.Element {
  const sub = subLens(lens, key);
  const children = objectFields(info.core).flatMap(([k, fieldSchema]) => {
    const i = describeField(fieldSchema);
    if (!i.meta) return [];
    const placeholder = i.meta.placeholder ?? defaultPlaceholder(i);
    return [fieldElement(k, i, i.meta, sub, placeholder)];
  });
  return (
    <CollapsibleGroup key={key} title={meta.label}>
      {children}
    </CollapsibleGroup>
  );
}

function renderField(
  key: string,
  kind: FieldKind,
  options: string[],
  meta: FieldMeta,
  draft: Draft<Values>,
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
