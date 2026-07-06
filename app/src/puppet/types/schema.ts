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

export type BaseSpecificConfig = z.infer<typeof BasePuppetConfigSchema>;
export type BaseSpecificConfigInput = z.input<typeof BasePuppetConfigSchema>;

export const PuppetTargetSchema = z.url();
export type PuppetTarget = z.infer<typeof PuppetTargetSchema>;


// Puppet Runtime
export const BasePuppetRuntime = z.object({
  view: z.string(), // TODO
})