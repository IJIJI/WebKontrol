import { type JSX } from "react/jsx-runtime";

import { type Draft } from "../../helpers/DraftSave";
import { type FieldMeta } from "../../../../src/views/types/schema";
import { describeField, objectFields, type FieldKind } from "./zodField";
import { CollapsibleGroup } from "./CollapsibleGroup";
import { TextSetting } from "./implementations/TextSetting";
import { UrlSetting } from "./implementations/UrlSetting";
import { NumberSetting } from "./implementations/NumberSetting";
import { ToggleSetting } from "./implementations/ToggleSetting";
import { SelectSetting } from "./implementations/SelectSetting";
import { BaseSetting } from "./BaseSetting";
import type { ZodObject, ZodRawShape } from "zod";

type Values = Record<string, unknown>;

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
  draft: Draft<Values>;
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
    const defaultStr =
      typeof info.defaultValue === "string" || typeof info.defaultValue === "number"
        ? String(info.defaultValue)
        : undefined;
    const placeholder = placeholders[key] ?? meta.placeholder ?? defaultStr;
    const element = renderField(key, info.kind, info.options, meta, draft, placeholder);
    (meta.advanced ? advanced : normal).push(element);
  }

  return (
    <>
      {normal}
      {advanced.length > 0 && <CollapsibleGroup title={advancedTitle}>{advanced}</CollapsibleGroup>}
    </>
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
