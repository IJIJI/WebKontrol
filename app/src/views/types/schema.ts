import z from "zod";
import { LoadTimeoutSchema, LoadTimeoutSchemaDefault } from "../../puppet/types/schema";
import { DisplayNameSchema } from "../../types/CommonTypes";
import { blockSlot } from "../blocks/types/schema";
import { EntityAppearanceField } from "../../common/entityAppearance/schema";

//* View identity:
// A view instance key. A generated slug, stable across renames so puppet
// assignments don't break; the display name lives in the config.
export const ViewKeySchema = z.string().min(2).max(18).toLowerCase().regex(/^[a-z][a-z0-9_-]*$/); // TODO: Common slug type?
export type ViewKey = z.infer<typeof ViewKeySchema>;

export const ViewTypeSchema = z.enum(["blocks", "url"]);
export type ViewType = z.infer<typeof ViewTypeSchema>;

/** Generate a slug ViewKey not already present in `existing`. */
export function generateViewKey(existing: Iterable<ViewKey> = []): ViewKey {
  const taken = new Set(existing);
  for (let attempt = 0; attempt < 1000; attempt++) { //TODO: Check attempt amount
    const key = `v${Math.random().toString(36).slice(2, 8)}`; 
    if (!taken.has(key)) return key;
  }
  throw new Error("Could not generate a unique view key");
}
//* Field UI metadata:
// Presentation metadata attached to config fields via `.meta()`, read by the schema-driven
// view editor. Minimal and presentation-neutral. Convention: fields WITHOUT meta are not
// auto-rendered (e.g. the `type` discriminator, which the editor renders as its own select).
// `advanced` fields are grouped into the editor's Advanced section (views only, for now).
export interface FieldMeta {
  label: string;
  description?: string; // maps to the Setting subtitle
  advanced?: boolean;
  // Collects this field into a named subsection of its own level, so a wide shape (a block's
  // ~20 style fields) stays scannable without nesting the stored data. Honoured for nested
  // levels; `advanced` is the equivalent at the top level of a config.
  group?: string;
  // An object field whose group starts folded. For sections that are large and only sometimes
  // relevant; a group holding a validation error opens regardless, so nothing hides.
  collapsed?: boolean;
  placeholder?: string;
  // Input widget hint for kinds the schema alone can't distinguish: "color" renders a
  // swatch-assisted text field (the value stays a free CSS string — gradients are valid);
  // "textarea" renders a multi-line text field; "font" renders a text field with font
  // suggestions (free text stays allowed); "range" pairs a number with a slider (bounds and
  // step still come from the schema, not from here); "box"/"corners" edit a CSS box shorthand
  // (padding/margin vs border-radius) as numbers, falling back to the raw string; "buttons"
  // shows a short enum as a button group instead of a dropdown; "alignment" renders a
  // {horizontal, vertical} object as one nine-cell grid rather than a nested group.
  input?: "color" | "textarea" | "font" | "range" | "box" | "corners" | "buttons" | "alignment";
  // Readable labels for an enum's raw values, where the stored value has to stay machine-shaped
  // (a CSS keyword, a numeric weight). The "" key relabels the unset entry of an optional enum,
  // which is worth doing for inheriting properties: there "unset" means inherit, not default.
  optionLabels?: Record<string, string>;
}

//* View config:
// The base every view config shares; per-type configs extend it with a `type`
// literal, mirroring extendPuppetConfig.
export const BaseViewConfigSchema = z.object({
  name: DisplayNameSchema.meta({ label: "Name" } satisfies FieldMeta),
  // per-view override of ViewManager.default_load_timeout
  loadTimeout: LoadTimeoutSchema.optional().meta({ label: "Load timeout", advanced: true, description: "Load timeout override. Leave empty to use the global default defined in config" } satisfies FieldMeta),
  // Presentation (colour/icon). No FieldMeta => the schema-driven editor skips it; it's rendered
  // in a dedicated Appearance section instead. Empty appearance collapses to undefined (not persisted).
  appearance: EntityAppearanceField,
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- returns an unwieldy zod schema type; inference is clearer.
export function extendViewConfig<const B extends ViewType, T extends z.ZodRawShape>(typeLiteral: B, shape: T) {
  return BaseViewConfigSchema.extend({
    type: z.literal(typeLiteral).default(typeLiteral),
    ...shape,
  });
}

//* Concrete view configs:
// BlockView: renders a block tree (its single root block) as a page.
export const BlockViewConfigSchema = extendViewConfig("blocks", {
  root: blockSlot({ label: "Root block" } satisfies FieldMeta),
});
export type BlockViewConfig = z.infer<typeof BlockViewConfigSchema>;

// UrlView: the puppet navigates an external URL, without an iframe, so pages that
// forbid embedding still load. Served via a redirect from /view/:key (GET only;
// parameters become the query string).
export const UrlViewConfigSchema = extendViewConfig("url", {
  url: z.url().meta({ label: "URL", placeholder: "https://example.com", description: "Website url to load. Opened directly without any embedding" } satisfies FieldMeta),
  parameters: z
    .record(z.string(), z.string())
    .optional()
    .meta({ label: "Parameters", advanced: true, description: "Get parameters added to the url" } satisfies FieldMeta),
});
export type UrlViewConfig = z.infer<typeof UrlViewConfigSchema>;

export const AnyViewConfigSchema = z.discriminatedUnion("type", [
  BlockViewConfigSchema,
  UrlViewConfigSchema,
]);
export type AnyViewConfig = z.infer<typeof AnyViewConfigSchema>;

// The base config type (name + loadTimeout), used as the AbstractView generic constraint.
export type ViewConfig = z.infer<typeof BaseViewConfigSchema>;

//* View manager config (static, from the config file):
export const ViewManagerConfigSchema = z.object({
  // The /view/:key route prefix; the express route and the puppet target both derive from it.
  route_base: z.string().startsWith("/").default("/view"),
});
export type ViewManagerConfig = z.infer<typeof ViewManagerConfigSchema>;
export type ViewManagerConfigInput = z.input<typeof ViewManagerConfigSchema>;

//* View manager runtime:
export const ViewManagerRuntimeShape = z.object({
  default_load_timeout: LoadTimeoutSchema,  // TODO: Should the load timeout be viewmanager defined? Would be usefull.
  // TODO: Add usefull fields
});

export const ViewManagerRuntimeSchema = ViewManagerRuntimeShape.extend({
  default_load_timeout: LoadTimeoutSchemaDefault.default(20_000),
});

export type ViewManagerRuntime = z.infer<typeof ViewManagerRuntimeSchema>;
export type ViewManagerRuntimeInput = z.input<typeof ViewManagerRuntimeSchema>;
