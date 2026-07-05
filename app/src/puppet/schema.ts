import { z } from "zod";

/**
 * This file contains all schema definitions for the puppets. That means the types need to be validated.
 * Those are types that are not generated or received from the internal code, and should thus not automatically be trusted.
 */
// TODO: Do the input types need to exist? If yes, implement! Probably not in the puppets, they do not carry defaults.

type PUPPET_BASE_BRAND<T extends string> = `puppet_${T}_config`;
type PUPPET_SPECIFIC_CONFIG_BRAND = PUPPET_BASE_BRAND<"specific">;
type PUPPET_RUNTIME_CONFIG_BRAND = PUPPET_BASE_BRAND<"runtime">;
type PUPPET_GLOBAL_CONFIG_BRAND = PUPPET_BASE_BRAND<"global">;
type PUPPET_CONFIG_BRAND = PUPPET_BASE_BRAND<"main">;

// Simple fields
export const PuppetKeySchema = z
  .string()
  .min(2)
  .max(12)
  .toLowerCase()
  .regex(/^[a-z0-9_-]+$/);
export type PuppetKey = z.infer<typeof PuppetKeySchema>;

export const PuppetTargetSchema = z.url();
export type PuppetTarget = z.infer<typeof PuppetTargetSchema>;

// Config: Specific
export const PuppetSpecificConfigShape = z.object({
  id: PuppetKeySchema,
  name: z.string().max(20).optional(),
});
export const PuppetSpecificConfigSchema =
  PuppetSpecificConfigShape.brand<PUPPET_SPECIFIC_CONFIG_BRAND>();

export type PupppetSpecificConfigBase = z.infer<
  typeof PuppetSpecificConfigShape
>;
export type PupppetSpecificConfig = z.infer<typeof PuppetSpecificConfigSchema>;
export type PupppetSpecificConfigInput = z.input<
  typeof PuppetSpecificConfigSchema
>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function extendPuppetSpecificConfig<
  const B extends string,
  T extends z.ZodRawShape,
>(typeLiteral: B, shape: T) {
  return PuppetSpecificConfigShape.extend({
    type: z.literal(typeLiteral).optional().default(typeLiteral),
    ...shape,
  }).brand<PUPPET_SPECIFIC_CONFIG_BRAND>();
}

// Config: Runtime
export const PuppetRuntimeConfigShape = z.object({
  target_url: PuppetTargetSchema,
});

export const PuppetRuntimeConfigSchema =
  PuppetRuntimeConfigShape.brand<PUPPET_RUNTIME_CONFIG_BRAND>();

export type PuppetRuntimeConfigBase = z.infer<typeof PuppetRuntimeConfigShape>;
export type PuppetRuntimeConfig = z.infer<typeof PuppetRuntimeConfigSchema>;
export type PuppetRuntimeConfigInput = z.input<
  typeof PuppetRuntimeConfigSchema
>;

// Config: Global
export const PuppetGlobalConfigShape = z.object({
  load_timout: z.number().min(0).optional().default(20000),
  // TODO: Action on load fail
});

export const PuppetGlobalConfigSchema =
  PuppetGlobalConfigShape.brand<PUPPET_GLOBAL_CONFIG_BRAND>();

export type PuppetGlobalConfigBase = z.infer<typeof PuppetGlobalConfigShape>;
export type PuppetGlobalConfig = z.infer<typeof PuppetGlobalConfigSchema>;
export type PuppetGlobalConfigInput = z.input<typeof PuppetGlobalConfigSchema>;

// Config: Full struct
export const PuppetConfigShape = z.object({
  specific: PuppetSpecificConfigSchema,
  runtime: PuppetRuntimeConfigSchema, // When a puppet is constructed and already has these runtime values set, they are loaded and overwritten.
  global: PuppetGlobalConfigSchema,
});

// TODO: Also add brandless bases here?
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function extendPuppetConfig<
  const B extends string,
  T extends z.ZodRawShape,
>(typeLiteral: B, shape: T) {
  return PuppetConfigShape.extend({
    type: z.literal(typeLiteral).optional().default(typeLiteral),
    ...shape,
  }).brand<PUPPET_CONFIG_BRAND>();
}

export const PuppetConfigSchema =
  PuppetConfigShape.brand<PUPPET_CONFIG_BRAND>();

export type PuppetConfig = z.infer<typeof PuppetConfigSchema>;
export type PuppetConfigInput = z.input<typeof PuppetConfigSchema>;
