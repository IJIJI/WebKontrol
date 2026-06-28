import z from "zod";

export const SystemConfigSchema = z.object({
  system_name: z.string().max(15).default("WebKontrol"),
});

export type SystemConfig = z.infer<typeof SystemConfigSchema>;
export type SystemConfigInput = z.input<typeof SystemConfigSchema>;
