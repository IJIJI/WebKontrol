import z from "zod";

export const CoreRuntimeConfigShape = z.object({
  system_name: z.string().max(15),
});

export const CoreRuntimeConfigSchema = CoreRuntimeConfigShape.extend({
  system_name: CoreRuntimeConfigShape.shape.system_name.default("WebKontrol"),
});

export type CoreRuntimeConfig = z.infer<typeof CoreRuntimeConfigSchema>;
export type CoreRuntimeConfigInput = z.input<typeof CoreRuntimeConfigSchema>;
