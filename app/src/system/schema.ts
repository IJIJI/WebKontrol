import z from "zod";

export const SystemRuntimeShape = z.object({
  system_name: z.string().max(15),
});

export const SystemRuntimeSchema = SystemRuntimeShape.extend({
  system_name: SystemRuntimeShape.shape.system_name.default("WebKontrol"),
});

export type CoreRuntimeConfig = z.infer<typeof SystemRuntimeSchema>;
export type CoreRuntimeConfigInput = z.input<typeof SystemRuntimeSchema>;
