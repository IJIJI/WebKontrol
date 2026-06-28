import z from "zod";

export const SystemConfigSchema = z.object({
  system_name: z.string().max(15).default("WebKontrol"),
});

export type SystemConfig = z.infer<typeof SystemConfigSchema>;
export type SystemConfigInput = z.input<typeof SystemConfigSchema>;

export const SystemInfoSchema = z.object({
  start_moment: z.number().int().min(0).default(0),
});

export type SystemInfo = z.infer<typeof SystemInfoSchema>;
export type SystemInfoInput = z.input<typeof SystemInfoSchema>;


export const SystemBundleSchema = z.object({
  info: SystemInfoSchema,
  config: SystemConfigSchema,
});

export type SystemBundle = z.infer<typeof SystemBundleSchema>;
export type SystemBundleInput = z.input<typeof SystemBundleSchema>;
