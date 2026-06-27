import { z } from 'zod';

/**
 * This file contains all schema definitions for the puppets. That means the types need to be validated. 
 * Those are types that are not generated or received from the internal code, and should thus not automatically be trusted.
 */

export const PuppetKeySchema = z.string().min(2).max(12).regex(/^[a-z0-9_-]+$/);
export type PuppetKey = z.infer<typeof PuppetKeySchema>;

export const PuppetTargetSchema = z.url();
export type PuppetTarget = z.infer<typeof PuppetTargetSchema>;

export const PuppetSpecificConfigSchema = z.object({
  id: PuppetKeySchema,
  name: z.string().max(20).optional(),
});

export type PupppetSpecificConfig = z.infer<typeof PuppetSpecificConfigSchema>;

export const PuppetGlobalConfigSchema = z.object({
  load_wait: z.number().min(0).default(2000),
  // TODO: Action on load fail
});

export type PuppetGlobalConfig = z.infer<typeof PuppetGlobalConfigSchema>;

export const PuppetRuntimeConfigSchema = z.object({
  target_url: PuppetTargetSchema,
});

export type PuppetRuntimeConfig = z.infer<typeof PuppetRuntimeConfigSchema>;

export const PuppetConfigShape = z.object({
  specific: PuppetSpecificConfigSchema,
  global: PuppetGlobalConfigSchema,
  runtime: PuppetRuntimeConfigSchema // When a puppet is constructed and already has these runtime values set, they are loaded and overwritten.
});

type PUPPET_CONFIG_BRAND = 'PuppetConfig';

export function extendPuppetConfig<const B extends string, T extends z.ZodRawShape>(
  concreteBrand: B,
  shape: T
) {
  return PuppetConfigShape
    .extend(shape)
    .brand<PUPPET_CONFIG_BRAND>()
    .brand<B>();
}

export const PuppetConfigSchema = PuppetConfigShape.brand<PUPPET_CONFIG_BRAND>();

export type PuppetConfig = z.infer<typeof PuppetConfigSchema>;