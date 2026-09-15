import z from "zod";

export const SystemRuntimeShape = z.object({
  system_name: z.string().max(15),
});

export const SystemRuntimeSchema = SystemRuntimeShape.extend({
  system_name: SystemRuntimeShape.shape.system_name.default("WebKontrol"),
});

export type SystemRuntime = z.infer<typeof SystemRuntimeSchema>;
export type SystemRuntimeInput = z.input<typeof SystemRuntimeSchema>;
