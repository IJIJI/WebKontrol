import z from "zod";

export const WebServerConfigSchema = z.object({
  port: z.number().gte(0).lte(65535).default(80),
});

export type WebServerConfig = z.infer<typeof WebServerConfigSchema>;
export type WebServerConfigInput = z.input<typeof WebServerConfigSchema>;
