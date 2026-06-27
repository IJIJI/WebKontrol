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
  name: z.string().min(1).max(50),
});

export type PupppetSpecificConfig = z.infer<typeof PuppetSpecificConfigSchema>;

export const PuppetGlobalConfigSchema = z.object({
  load_wait: z.number().min(0).default(2000),
  // TODO: Action on load fail
});

export type PuppetGlobalConfig = z.infer<typeof PuppetGlobalConfigSchema>;

export const PuppetDefaultRuntimeConfigSchema = z.object({
  target_url: PuppetTargetSchema,
});

export type PuppetDefaultRuntimeConfig = z.infer<typeof PuppetDefaultRuntimeConfigSchema>;

export const PuppetConfigSchema = z.object({
  specific: PuppetSpecificConfigSchema,
  global: PuppetGlobalConfigSchema,
  runtime: PuppetDefaultRuntimeConfigSchema // When a puppet is constructed and already has these runtime values set, they are loaded and overwritten.
});

export type PuppetConfig = z.infer<typeof PuppetConfigSchema>;