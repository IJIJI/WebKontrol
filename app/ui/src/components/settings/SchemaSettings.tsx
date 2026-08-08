import { type JSX } from "react/jsx-runtime";

import { type FieldMeta } from "../../../../src/views/types/schema";
import { describeField, objectFields, type FieldInfo } from "./zodField";
import { Button } from "../button/Button";
import { Icons } from "../icons/Icons";
import { FillStyle, Variant } from "../../common/types/variants";
import { CollapsibleGroup } from "./CollapsibleGroup";
import { TextSetting } from "./implementations/TextSetting";
import { TextAreaSetting } from "./implementations/TextAreaSetting";
import { FontSetting } from "./implementations/FontSetting";
import { BoxSetting } from "./implementations/BoxSetting";
import { UrlSetting } from "./implementations/UrlSetting";
import { NumberSetting } from "./implementations/NumberSetting";
import { RangeSetting } from "./implementations/RangeSetting";
import { ColorTextSetting } from "./implementations/ColorTextSetting";
import { ToggleSetting } from "./implementations/ToggleSetting";
import { SelectSetting } from "./implementations/SelectSetting";
import { ButtonSelectSetting } from "./implementations/ButtonSelectSetting";
import { AlignmentSetting, type AlignmentValue } from "./implementations/AlignmentSetting";
import { BaseSetting } from "./BaseSetting";
import type { ZodObject, ZodRawShape } from "zod";
import { SettingGroup } from "./SettingGroup";
import { DetailGroup, DetailRow, InlineValue, countLabel, displayValue } from "./SchemaDetails";
import { arrayMove } from "../../common/helpers/arrayMove";

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

// Everything the recursion carries that isn't per-field. Bundled so nesting levels (objects,
// array items) forward one value instead of a growing parameter list.
interface RenderCtx {
  renderCustom?: CustomFieldRenderer;
  joined: boolean;
  readOnly: boolean;
  /** Validation messages by dotted field path, e.g. `url` or `style.fontSize`. */
  errors?: Map<string, string>;
}

/** The error for a field at `path` + `key`, if any. */
function errorAt(ctx: RenderCtx, path: readonly (string | number)[], key: string): string | undefined {
  return ctx.errors?.get([...path, key].join("."));
}

/** Whether anything at or below `path` + `key` is invalid, so a folded group can open itself. */
function hasErrorWithin(ctx: RenderCtx, path: readonly (string | number)[], key: string): boolean {
  const base = [...path, key].join(".");
  for (const field of ctx.errors?.keys() ?? []) {
    if (field === base || field.startsWith(`${base}.`)) return true;
  }
  return false;
}

// Renders Setting components for a zod object schema, driven by each field's FieldMeta and
// wired through a useDraft (or any DraftLens). Fields without meta are skipped (e.g. the `type`
// discriminator); `exclude` skips fields the page renders itself (e.g. name, in the top row).
// Advanced fields (meta.advanced) fold into a collapsible section, omitted entirely when there
// are none. Plain nested objects and arrays of objects render as their own sections, recursively.
export function SchemaSettings({
  schema,
  draft,
  exclude = [],
  advancedTitle = "Advanced",
  placeholders = {},
  renderCustom,
  groupTitle = "Type Specific",
  joined = false,
  readOnly = false,
  errors,
}: {
  schema: ZodObject<ZodRawShape>; // the current view type's member schema (any zod object)
  draft: DraftLens;
  exclude?: string[];
  advancedTitle?: string;
  placeholders?: Record<string, string>; // per-key placeholder overrides (e.g. a runtime default)
  renderCustom?: CustomFieldRenderer;
  groupTitle?: string;
  joined?: boolean; // one divided card per group instead of an island per field
  readOnly?: boolean; // render values instead of inputs (same walk, inspection presentation)
  errors?: Map<string, string>; // validation messages by dotted field path
}): JSX.Element {
  const ctx: RenderCtx = { renderCustom, joined, readOnly, errors };

  // Inspection: one compact property list, not form rows. Same walk and labels, no form chrome
  // (no group cards, no advanced fold) Top-level fields are line-divided sections.
  if (readOnly) {
    const rows = levelFields(schema, draft, [], ctx);
    return (
      <div className="schemaDetails">
        {rows.length === 0 ? (
          <div className="empty">No fields</div>
        ) : (
          rows.map((row) => (
            <div className="section" key={row.key}>
              {row}
            </div>
          ))
        )}
      </div>
    );
  }

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
        ? objectGroup(key, info, meta, draft, [], ctx)
        : info.kind === "array"
          ? arrayGroup(key, info, meta, draft, [], ctx)
          : renderField(key, info, meta, draft, placeholder, ctx, []));
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
  path: readonly (string | number)[],
  ctx: RenderCtx,
): JSX.Element {
  const custom = ctx.renderCustom?.(key, info, lens, path);
  if (custom) return custom;
  // An object rendered as one widget instead of a nested group. Inspection keeps the group: a
  // read-only picker would be a worse way to read two values than simply listing them.
  if (info.kind === "object" && meta.input === "alignment" && !ctx.readOnly) {
    return alignmentField(key, info, meta, lens, path, ctx);
  }
  if (info.kind === "object") return objectGroup(key, info, meta, lens, path, ctx);
  if (info.kind === "array") return arrayGroup(key, info, meta, lens, path, ctx);
  return renderField(key, info, meta, lens, placeholder, ctx, path);
}

// The meta'd fields of one object level (an object field's shape, or one array item), rendered
// through the given lens. Fields carrying `meta.group` are gathered into a collapsed subsection
// per group, listed after the ungrouped ones; the stored shape is untouched, this is purely how
// a wide level is presented. Shared by objectGroup and arrayGroup.
function levelFields(
  core: unknown,
  lens: DraftLens,
  path: readonly (string | number)[],
  ctx: RenderCtx,
): JSX.Element[] {
  const loose: JSX.Element[] = [];
  const grouped = new Map<string, JSX.Element[]>(); // insertion order = schema order

  for (const [key, fieldSchema] of objectFields(core)) {
    const info = describeField(fieldSchema);
    if (!info.meta) continue; // no meta => not auto-rendered
    const placeholder = info.meta.placeholder ?? defaultPlaceholder(info);
    const element = fieldElement(key, info, info.meta, lens, placeholder, path, ctx);

    const group = info.meta.group;
    if (group === undefined) {
      loose.push(element);
      continue;
    }
    const existing = grouped.get(group);
    if (existing) existing.push(element);
    else grouped.set(group, [element]);
  }

  return [...loose, ...[...grouped].map(([title, fields]) => subsection(title, fields, ctx))];
}

// One `meta.group` subsection. Open: these label the parts of a level, they are not another
// thing to unfold. Folding a whole section is the parent group's job (see meta.collapsed).
function subsection(title: string, fields: JSX.Element[], ctx: RenderCtx): JSX.Element {
  if (ctx.readOnly) {
    return (
      <DetailGroup key={`group:${title}`} label={title} count={countLabel(fields.length, "field")} defaultOpen>
        {fields}
      </DetailGroup>
    );
  }
  return (
    <CollapsibleGroup key={`group:${title}`} title={title} defaultOpen joined={ctx.joined}>
      {fields}
    </CollapsibleGroup>
  );
}

/**
 * A two-axis position pair as a single grid picker. The stored shape is untouched: the widget
 * reads and writes the same `{horizontal, vertical}` object the nested group would have.
 */
function alignmentField(
  key: string,
  info: FieldInfo,
  meta: FieldMeta,
  lens: DraftLens,
  path: readonly (string | number)[],
  ctx: RenderCtx,
): JSX.Element {
  // The pair's own field defaults (a chip centres, a freeform item anchors top-left), which the
  // prefaulted object itself doesn't carry: its fallback is a bare `{}`.
  const defaults = seedFromDefaults(info.core) as unknown as AlignmentValue;
  const stored = lens.values[key] as Partial<AlignmentValue> | undefined;

  return (
    <AlignmentSetting
      key={key}
      title={meta.label}
      subtitle={meta.description}
      error={errorAt(ctx, path, key)}
      // Merged per axis, so a config holding only one of the two still shows the other.
      value={{ ...defaults, ...stored }}
      savedVal={lens.saved[key] as AlignmentValue | undefined}
      setValue={(next) =>
        // Absent means the defaults apply, the same rule the enums follow: picking the default
        // position stores nothing rather than pinning it.
        lens.setField(
          key,
          next.horizontal === defaults.horizontal && next.vertical === defaults.vertical ? undefined : next,
        )
      }
    />
  );
}

// A nested object field as its own collapsible group, open by default (folding is for skipping,
// not hiding, only the Advanced section starts closed). Fields wire through a sub-lens; the
// advanced flag is only honoured at the top level, nested fields render flat.
function objectGroup(
  key: string,
  info: FieldInfo,
  meta: FieldMeta,
  lens: DraftLens,
  path: readonly (string | number)[],
  ctx: RenderCtx,
): JSX.Element {
  const children = levelFields(info.core, subLens(lens, key), [...path, key], ctx);
  // `collapsed` groups start folded, but never while something inside them is invalid: folding
  // must not hide the reason a save was refused.
  const open = !meta.collapsed || hasErrorWithin(ctx, path, key);
  if (ctx.readOnly) {
    // Top-level groups open, deeper ones start collapsed (matching the old inspector).
    return (
      <DetailGroup
        key={key}
        label={meta.label}
        count={countLabel(children.length, "field")}
        defaultOpen={path.length === 0 && open}
      >
        {children}
      </DetailGroup>
    );
  }
  return (
    <CollapsibleGroup key={key} title={meta.label} defaultOpen={open} joined={ctx.joined}>
      {children}
    </CollapsibleGroup>
  );
}

// An array-of-objects field: its items listed in one collapsible group, each with a small header
// (index + remove) above its fields, and an add button that appends an item seeded from the
// schema's defaults. Arrays of anything else fall back to the read-only display.
function arrayGroup(
  key: string,
  info: FieldInfo,
  meta: FieldMeta,
  lens: DraftLens,
  path: readonly (string | number)[],
  ctx: RenderCtx,
): JSX.Element {
  const element = (info.core as { element?: unknown }).element;
  const elementInfo = element === undefined ? undefined : describeField(element);
  if (elementInfo?.kind !== "object") {
    return renderField(key, { ...info, kind: "unknown" }, meta, lens, undefined, ctx, path);
  }

  const raw: unknown[] = Array.isArray(lens.values[key]) ? (lens.values[key] as unknown[]) : [];
  const itemFields = (index: number): JSX.Element[] =>
    levelFields(elementInfo.core, itemLens(lens, key, index), [...path, key, index], ctx);

  if (ctx.readOnly) {
    // Array items sit flat at the array's own level: they have no field name of their own, so
    // indenting them would imply a nesting step that isn't there.
    return (
      <DetailGroup
        key={key}
        label={meta.label}
        count={countLabel(raw.length, "item")}
        flat
        defaultOpen={path.length === 0}
      >
        {raw.map((_, index) => (
          <DetailGroup key={index} label={`#${index + 1}`} count={countLabel(itemFields(index).length, "field")}>
            {itemFields(index)}
          </DetailGroup>
        ))}
      </DetailGroup>
    );
  }

  const items = raw.map((_, index) => (
    <div className="arrayItem" key={index}>
      <div className="arrayItemHead">
        <span className="label">#{index + 1}</span>
        <span className="arrayItemActions">
          <Button
            fillStyle={FillStyle.SKELETON}
            onClick={() => lens.setField(key, arrayMove(raw, index, index - 1))}
            disabled={index === 0}
            ariaLabel="Move up"
          >
            <Icons.chevronUp size={14} />
          </Button>
          <Button
            fillStyle={FillStyle.SKELETON}
            onClick={() => lens.setField(key, arrayMove(raw, index, index + 1))}
            disabled={index === raw.length - 1}
            ariaLabel="Move down"
          >
            <Icons.chevronDown size={14} />
          </Button>
          <Button
            fillStyle={FillStyle.SKELETON}
            variant={Variant.DANGER}
            onClick={() => lens.setField(key, raw.filter((_, j) => j !== index))}
            ariaLabel="Remove item"
          >
            <Icons.delete size={14} />
          </Button>
        </span>
      </div>
      {itemFields(index)}
    </div>
  ));

  return (
    <CollapsibleGroup key={key} title={meta.label} defaultOpen joined={ctx.joined}>
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
  info: FieldInfo,
  meta: FieldMeta,
  draft: DraftLens,
  placeholder: string | undefined,
  ctx: RenderCtx,
  path: readonly (string | number)[] = [],
): JSX.Element {
  const { kind, options } = info;
  const title = meta.label;
  const subtitle = meta.description;
  const error = errorAt(ctx, path, key);
  const value = draft.values[key];
  const saved = draft.saved[key];
  const set = (v: unknown): void => draft.setField(key, v);

  // Inspection: a compact property row, not a form row.
  if (ctx.readOnly) {
    return (
      <DetailRow key={key} label={title}>
        <InlineValue value={value} />
      </DetailRow>
    );
  }

  // Kinds with no editable widget yet: shown read-only inside the form so nothing disappears.
  if (kind === "record" || kind === "unknown") {
    return (
      <BaseSetting key={key} title={title} subtitle={subtitle} error={error}>
        <span className="readonlyValue">{displayValue(value)}</span>
      </BaseSetting>
    );
  }

  switch (kind) {
    case "url":
      return (
        <UrlSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder} error={error}
          value={(value as string) ?? ""} savedVal={saved as string | undefined} setValue={set} />
      );
    case "text":
      // The schema can't distinguish a colour string from any other; the meta hint does.
      if (meta.input === "color") {
        return (
          <ColorTextSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder} error={error}
            value={(value as string) ?? ""} savedVal={saved as string | undefined} setValue={set} />
        );
      }
      if (meta.input === "textarea") {
        return (
          <TextAreaSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder} error={error}
            value={(value as string) ?? ""} savedVal={saved as string | undefined} setValue={set} />
        );
      }
      if (meta.input === "font") {
        return (
          <FontSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder} error={error}
            value={(value as string) ?? ""} savedVal={saved as string | undefined} setValue={set} />
        );
      }
      if (meta.input === "box" || meta.input === "corners") {
        return (
          <BoxSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder} error={error}
            corners={meta.input === "corners"}
            value={value as string | undefined} savedVal={saved as string | undefined} setValue={set} />
        );
      }
      return (
        <TextSetting key={key} title={title} subtitle={subtitle} placeholder={placeholder} error={error}
          value={(value as string) ?? ""} savedVal={saved as string | undefined} setValue={set} />
      );
    case "number": {
      // A slider needs both ends to have somewhere to travel; without them fall back to the
      // plain number box rather than rendering a slider with no range.
      const Widget = meta.input === "range" && info.min !== undefined && info.max !== undefined
        ? RangeSetting
        : NumberSetting;
      return (
        <Widget key={key} title={title} subtitle={subtitle} placeholder={placeholder} error={error}
          min={info.min} max={info.max} step={info.step}
          value={value as number | undefined} savedVal={saved as number | undefined} setValue={set} />
      );
    }
    case "boolean":
      return (
        <ToggleSetting key={key} title={title} subtitle={subtitle} error={error}
          value={Boolean(value)} savedVal={saved as boolean | undefined} setValue={set} />
      );
    case "enum": {
      const defaultValue = info.defaultValue as string | undefined;
      const enumProps = {
        title, subtitle, error,
        // Fall back to the schema default so an untouched field shows what it actually renders
        // as. Without it nothing is selected at all, which reads as "no value" on a field that
        // very much has one. An optional field has no default, so it lands on "(default)".
        value: (value as string) ?? defaultValue ?? "",
        savedVal: saved as string | undefined,
        // Absent means "the default applies", so picking the default stores nothing: choosing it
        // *is* the way to unset, without a second reset control competing with the restore
        // button beside it. Keeps configs to what was actually chosen, and lets a default we
        // improve later reach the views that never overrode it. An optional enum has no default
        // of its own, and clears through its explicit "(default)" entry instead.
        setValue: (v: string) => set(v === "" || v === defaultValue ? undefined : v),
        options: [
          ...(info.optional ? [{ label: meta.optionLabels?.[""] ?? "(default)", value: "" }] : []),
          ...options.map((o) => ({ label: meta.optionLabels?.[o] ?? o, value: o })),
        ],
      };
      // Buttons are opt-in rather than inferred from the option count: whether they fit depends
      // on how long the labels are, which only the field's author knows.
      return meta.input === "buttons"
        ? <ButtonSelectSetting key={key} {...enumProps} />
        : <SelectSetting key={key} {...enumProps} />;
    }
    default:
      // Object/array reach here only via arrayGroup's non-object-element fallback above.
      return (
        <BaseSetting key={key} title={title} subtitle={subtitle} error={error}>
          <span className="readonlyValue">{displayValue(value)}</span>
        </BaseSetting>
      );
  }
}
