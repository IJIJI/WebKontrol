import z from "zod";
import { LoadTimeoutSchema, LoadTimeoutSchemaDefault } from "../../puppet/types/schema";


export const ViewManagerRuntimeShape = z.object({
  default_load_timeout: LoadTimeoutSchema, // TODO: Add usefull fields, this is a placeholder.
});

export const ViewManagerRuntimeSchema = ViewManagerRuntimeShape.extend({
  default_load_timeout: LoadTimeoutSchemaDefault
});

export type ViewManagerRuntime = z.infer<typeof ViewManagerRuntimeSchema>;
export type ViewManagerRuntimeInput = z.input<typeof ViewManagerRuntimeSchema>;
