import z from "zod";
import { ConfigFilePuppetSpecificSchema } from "../../puppet/types/validation";
import { WebServerConfigSchema } from "../../webServer/schema";
import { ViewManagerConfigSchema } from "../../views/types/schema";


// api_base exists for the update e2e (and any dev harness): point a managed test root at
// a local fake GitHub. The repo identity itself stays baked in from package.json.
const UpdateConfigSchema = z.object({
  api_base: z.string().default("https://api.github.com"),
});

export const AppConfigSchema = z.object({
  puppets: z.array(ConfigFilePuppetSpecificSchema), // TODO: Autoderive short name from ID? (Without the lowercase conversion)
  web: WebServerConfigSchema.default(WebServerConfigSchema.parse({})),
  views: ViewManagerConfigSchema.default(ViewManagerConfigSchema.parse({})),
  update: UpdateConfigSchema.default(UpdateConfigSchema.parse({})),
});


export type AppConfig = z.infer<typeof AppConfigSchema>;

