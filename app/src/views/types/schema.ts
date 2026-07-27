import z from "zod";
import { LoadTimeoutSchema, LoadTimeoutSchemaDefault } from "../../puppet/types/schema";
import { DisplayNameSchema } from "../../types/CommonTypes";
import { AnyBlockConfigSchema } from "../blocks/types/schema";

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
  placeholder?: string;
}

//* View config:
// The base every view config shares; per-type configs extend it with a `type`
// literal, mirroring extendPuppetConfig.
export const BaseViewConfigSchema = z.object({
  name: DisplayNameSchema.meta({ label: "Name" } satisfies FieldMeta),
  // per-view override of ViewManager.default_load_timeout
  loadTimeout: LoadTimeoutSchema.optional().meta({ label: "Load timeout", advanced: true, description: "Load timeout override. Leave empty to use the global default defined in config" } satisfies FieldMeta),
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
  root: AnyBlockConfigSchema.meta({ label: "Root block" } satisfies FieldMeta),
});
export type BlockViewConfig = z.infer<typeof BlockViewConfigSchema>;

// UrlView: the puppet navigates an external URL, without an iframe, so pages that
// forbid embedding still load. Served via a redirect from /view/:key (GET only;
// parameters become the query string).
export const UrlViewConfigSchema = extendViewConfig("url", {
  url: z.url().meta({ label: "URL", placeholder: "https://example.com" } satisfies FieldMeta),
  parameters: z
    .record(z.string(), z.string())
    .optional()
    .meta({ label: "Parameters", advanced: true } satisfies FieldMeta),
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
