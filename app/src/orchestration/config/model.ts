import z from "zod";
import { ConfigFilePuppetSpecificSchema, IncomingPuppetConfigSchema } from "../../puppet/types/validation";
import { WebServerConfigSchema } from "../../webServer/schema";


export const AppConfigSchema = z.object({
  puppets: z.array(ConfigFilePuppetSpecificSchema),
  web: WebServerConfigSchema.default(WebServerConfigSchema.parse({}))
});


export type AppConfig = z.infer<typeof AppConfigSchema>;

