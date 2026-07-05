import z from "zod";


export const AppConfigSchema = z.object({
  puppet: z.string(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

