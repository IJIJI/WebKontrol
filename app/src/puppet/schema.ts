import { z } from 'zod';

/**
 * This file contains all schema definitions for the puppets. That means the types need to be validated. 
 * Those are types that are not generated or received from the internal code, and should thus not automatically be trusted.
 */
// TODO: Do the input types need to exist? If yes, implement! Probably not in the puppets, they do not carry defaults.

type PUPPET_BASE_BRAND = 'puppet';
type PUPPET_SPECIFIC_CONFIG_BRAND = 'specific';
type PUPPET_RUNTIME_CONFIG_BRAND = 'runtime';
type PUPPET_CONFIG_BRAND = 'config';


export const PuppetKeySchema = z.string().min(2).max(12).regex(/^[a-z0-9_-]+$/);
export type PuppetKey = z.infer<typeof PuppetKeySchema>;

export const PuppetTargetSchema = z.url();
export type PuppetTarget = z.infer<typeof PuppetTargetSchema>;

export const PuppetSpecificConfigSchema = z.object({
  id: PuppetKeySchema,
  name: z.string().max(20).optional(),
});

export type PupppetSpecificConfig = z.infer<typeof PuppetSpecificConfigSchema>;
export type PupppetSpecificConfigInput = z.input<typeof PuppetSpecificConfigSchema>;

export const PuppetRuntimeConfigSchema = z.object({
  target_url: PuppetTargetSchema,
});

export type PuppetRuntimeConfig = z.infer<typeof PuppetRuntimeConfigSchema>;
export type PuppetRuntimeConfigInput = z.input<typeof PuppetRuntimeConfigSchema>;

export const PuppetGlobalConfigSchema = z.object({
  load_timout: z.number().min(0).optional().default(20000),
  // TODO: Action on load fail
});

export type PuppetGlobalConfig = z.infer<typeof PuppetGlobalConfigSchema>;
export type PuppetGlobalConfigInput = z.input<typeof PuppetGlobalConfigSchema>;

export const PuppetConfigShape = z.object({
  specific: PuppetSpecificConfigSchema,
  runtime: PuppetRuntimeConfigSchema, // When a puppet is constructed and already has these runtime values set, they are loaded and overwritten.
  global: PuppetGlobalConfigSchema,
});


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function extendPuppetConfig<const B extends string, T extends z.ZodRawShape>(
  typeLiteral: B,
  shape: T
) {
  return PuppetConfigShape
    .extend({
      type: z.literal(typeLiteral),
      ...shape
    })
    .brand<PUPPET_CONFIG_BRAND>()
    .brand<B>();
}

export const PuppetConfigSchema = PuppetConfigShape.brand<PUPPET_CONFIG_BRAND>();

export type PuppetConfig = z.infer<typeof PuppetConfigSchema>;
export type PuppetConfigInput = z.input<typeof PuppetConfigSchema>;