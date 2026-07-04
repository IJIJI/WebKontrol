import z from "zod";

export const CoreRuntimeConfigSchema = z.object({
  system_name: z.string().max(15).default("WebKontrol"),
});

export type CoreRuntimeConfig = z.infer<typeof CoreRuntimeConfigSchema>;
export type CoreRuntimeConfigInput = z.input<typeof CoreRuntimeConfigSchema>;
