import z from "zod";
import { LoadTimeoutSchema, LoadTimeoutSchemaDefault } from "../../puppet/types/schema";
import { DisplayNameSchema } from "../../types/CommonTypes";

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

//* Navigation target:
// What a view resolves to for the puppet to load. Richer than a bare url so the
// url view can POST / send headers. (Reconciled with PuppetTarget in the puppet
// wiring slice.)
export const ViewTargetSchema = z.object({
  url: z.url(),
  method: z.enum(["GET", "POST"]).optional(), // TODO: More methods? Probably not needed.
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  loadTimeout: LoadTimeoutSchema.optional(), // effective timeout, filled by AbstractView.resolve()
});
export type ViewTarget = z.infer<typeof ViewTargetSchema>;

/** Context a view needs to resolve its target (e.g. the app's own serve base for block views). */
export interface ViewResolveContext {
  serveBase: string;
  defaultLoadTimeout: number; // ViewManager default; a view's own loadTimeout overrides it
}

//* View config:
// The base every view config shares; per-type configs extend it with a `type`
// literal, mirroring extendPuppetConfig.
export const BaseViewConfigSchema = z.object({
  name: DisplayNameSchema,
  loadTimeout: LoadTimeoutSchema.optional(), // per-view override of ViewManager.default_load_timeout
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- returns an unwieldy zod schema type; inference is clearer.
export function extendViewConfig<const B extends ViewType, T extends z.ZodRawShape>(typeLiteral: B, shape: T) {
  return BaseViewConfigSchema.extend({
    type: z.literal(typeLiteral).optional().default(typeLiteral),
    ...shape,
  });
}

// Temporary alias: the store parses this until it moves to AnyViewConfig (#20).
export const ViewConfigSchema = BaseViewConfigSchema;
export type ViewConfig = z.infer<typeof ViewConfigSchema>;

//* View manager runtime:
export const ViewManagerRuntimeShape = z.object({
  default_load_timeout: LoadTimeoutSchema,  // TODO: Should the load timeout be viewmanager defined? Would be usefull.
  // TODO: Add usefull fields
});

export const ViewManagerRuntimeSchema = ViewManagerRuntimeShape.extend({
  default_load_timeout: LoadTimeoutSchemaDefault
});

export type ViewManagerRuntime = z.infer<typeof ViewManagerRuntimeSchema>;
export type ViewManagerRuntimeInput = z.input<typeof ViewManagerRuntimeSchema>;
