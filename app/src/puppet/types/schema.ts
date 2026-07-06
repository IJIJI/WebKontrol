import z from "zod";
import { DisplayNameSchema } from "../../types/CommonTypes";


// Puppet Config
export const PuppetKeySchema = z
  .string()
  .min(2)
  .max(12)
  .toLowerCase()
  .regex(/^[a-z0-9_-]+$/);
export type PuppetKey = z.infer<typeof PuppetKeySchema>;

export const BasePuppetConfigSchema = z.object({
  id: PuppetKeySchema,
  name: DisplayNameSchema.optional(),
});

export type BasePuppetConfig = z.infer<typeof BasePuppetConfigSchema>;
export type BasePuppetConfigInput = z.input<typeof BasePuppetConfigSchema>;


// TODO: Move to view?
export const PuppetTargetSchema = z.url();
export type PuppetTarget = z.infer<typeof PuppetTargetSchema>;


// Puppet Runtime
export const PuppetRuntimeSchema = z.object({
  target: PuppetTargetSchema, // TODO should this be a view? Or should the viewmanager supply the target?
})

export type PuppetRuntime = z.infer<typeof PuppetRuntimeSchema>;
export type PuppetRuntimeInput = z.input<typeof PuppetRuntimeSchema>;