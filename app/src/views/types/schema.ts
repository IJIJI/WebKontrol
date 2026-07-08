import z from "zod";
import { LoadTimeoutSchema, LoadTimeoutSchemaDefault } from "../../puppet/types/schema";

// TODO: Once views have per-type fields (e.g. WebsiteView), follow the
// extendPuppetConfig pattern (base shape + type literal) instead of one flat shape.
export const ViewConfigSchema = z.object({
  name: z.string(),
});

export type ViewConfig = z.infer<typeof ViewConfigSchema>;
export type ViewConfigInput = z.input<typeof ViewConfigSchema>;

export const ViewManagerRuntimeShape = z.object({
  default_load_timeout: LoadTimeoutSchema, // TODO: Add usefull fields, this is a placeholder.
});

export const ViewManagerRuntimeSchema = ViewManagerRuntimeShape.extend({
  default_load_timeout: LoadTimeoutSchemaDefault
});

export type ViewManagerRuntime = z.infer<typeof ViewManagerRuntimeSchema>;
export type ViewManagerRuntimeInput = z.input<typeof ViewManagerRuntimeSchema>;
