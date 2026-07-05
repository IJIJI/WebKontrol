import z from "zod";
import { ConfigFilePuppetSpecificSchema } from "../../puppet/validation";


export const AppConfigSchema = z.object({
  puppets: z.array(ConfigFilePuppetSpecificSchema),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

