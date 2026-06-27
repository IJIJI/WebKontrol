import { z } from 'zod';

/**
 * This file contains all schema definitions for the puppets. That means the types need to be validated. 
 * Those are types that are not generated or received from the internal code, and should thus not automatically be trusted.
 */


export const PuppetKeySchema = z.string().min(2).max(12).regex(/^[a-z0-9_-]+$/);
export type PuppetKey = z.infer<typeof PuppetKeySchema>;

export const PuppetTargetSchema = z.url();
export type PuppetTarget = z.infer<typeof PuppetTargetSchema>;


export const PuppetConfigSchema = z.object({
  id: PuppetKeySchema,
  name: z.string().min(1).max(50),
  target_url: PuppetTargetSchema,
  load_wait: z.number().min(0).default(2000)
});

export type PuppetConfig = z.infer<typeof PuppetConfigSchema>;