import z from "zod";
import { ConfigFilePuppetSpecificSchema } from "../../puppet/validation";
import { PuppetGlobalConfigSchema } from "../../puppet/schema";
import { WebServerConfigSchema } from "../../webServer/schema";


export const AppConfigSchema = z.object({
  puppets: z.object({
    global: PuppetGlobalConfigSchema,
    entries: z.array(ConfigFilePuppetSpecificSchema),
  }),
  web: WebServerConfigSchema.default(WebServerConfigSchema.parse({}))
});


export type AppConfig = z.infer<typeof AppConfigSchema>;

