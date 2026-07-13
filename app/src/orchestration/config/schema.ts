import z from "zod";
import { ConfigFilePuppetSpecificSchema } from "../../puppet/types/validation";
import { WebServerConfigSchema } from "../../webServer/schema";
import { ViewManagerConfigSchema } from "../../views/types/schema";


export const AppConfigSchema = z.object({
  puppets: z.array(ConfigFilePuppetSpecificSchema), // TODO: Autoderive short name from ID? (Without the lowercase conversion)
  web: WebServerConfigSchema.default(WebServerConfigSchema.parse({})),
  views: ViewManagerConfigSchema.default(ViewManagerConfigSchema.parse({})),
});


export type AppConfig = z.infer<typeof AppConfigSchema>;

