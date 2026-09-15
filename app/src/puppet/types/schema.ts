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

// Puppet Runtime
export const PuppetRuntimeShape = z.object({
  rotation: z.number().min(0).max(270).multipleOf(90),
  scale: z.number().min(0.25).max(4),
  reload_interval: z.number().min(60_000).max(7 * 24 * 60 * 60 * 1000).optional(),
});

export const PuppetRuntimeSchema = PuppetRuntimeShape.extend({
  rotation: PuppetRuntimeShape.shape.rotation.default(0),
  scale: PuppetRuntimeShape.shape.scale.default(1),
});

export type PuppetRuntime = z.infer<typeof PuppetRuntimeSchema>;
export type PuppetRuntimeInput = z.input<typeof PuppetRuntimeSchema>;


// Puppet Navigation
export const PuppetTargetSchema = z.url();
export type PuppetTarget = z.infer<typeof PuppetTargetSchema>;

export const LoadTimeoutSchema = z.number().min(500).or(z.literal(0));


export const NavigationRequestShape = z.object({
  target: PuppetTargetSchema,
  load_timeout: LoadTimeoutSchema, // 0 disables the timeout
});

export const NavigationRequestSchema = NavigationRequestShape;

export const BLANK_NAVIGATION_REQUEST = NavigationRequestSchema.parse({ target: "about:blank", load_timeout: 0 });

export type NavigationRequest = z.infer<typeof NavigationRequestSchema>;
export type NavigationRequestInput = z.input<typeof NavigationRequestSchema>;