import z from "zod";

const SseConfigSchema = z.object({
  ping_interval: z.number().min(500).max(25_000).default(1000),
});

export const WebServerConfigSchema = z.object({
  port: z.number().gte(0).lte(65535).default(80),
  sse: SseConfigSchema.default(SseConfigSchema.parse({})),
});

export type WebServerConfig = z.infer<typeof WebServerConfigSchema>;
export type WebServerConfigInput = z.input<typeof WebServerConfigSchema>;
