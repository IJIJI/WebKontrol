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
  name: DisplayNameSchema, // TODO: Autoderive short name from ID? (Without the lowercase conversion)
});

export type BasePuppetConfig = z.infer<typeof BasePuppetConfigSchema>;
export type BasePuppetConfigInput = z.input<typeof BasePuppetConfigSchema>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function extendPuppetConfig<
  const B extends string,
  T extends z.ZodRawShape,
>(typeLiteral: B, shape: T) {
  return BasePuppetConfigSchema.extend({
    type: z.literal(typeLiteral).optional().default(typeLiteral),
    ...shape,
  });
}

// TODO: Move to view?
export const PuppetTargetSchema = z.url();
export type PuppetTarget = z.infer<typeof PuppetTargetSchema>;


// Puppet Runtime
export const PuppetRuntimeShape = z.object({
  target: PuppetTargetSchema, // TODO should this be a view? Or should the viewmanager supply the target? Should it have a target field with the url and timeout + etc?
  load_timout: z.number().min(500).or(z.literal(0)), // 0 disables the timeout
});

export const PuppetRuntimeSchema = PuppetRuntimeShape.extend({
  load_timout: PuppetRuntimeShape.shape.load_timout.default(20_000),
});

export type PuppetRuntime = z.infer<typeof PuppetRuntimeSchema>;
export type PuppetRuntimeInput = z.input<typeof PuppetRuntimeSchema>;

export const BLANK_PUPPET_TARGET = PuppetRuntimeSchema.parse({ target: "about:blank" })