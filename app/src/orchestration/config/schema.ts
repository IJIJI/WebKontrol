import z from "zod";
import { ConfigFilePuppetSpecificSchema } from "../../puppet/types/validation";
import { WebServerConfigSchema } from "../../webServer/schema";
import { ViewManagerConfigSchema } from "../../views/types/schema";


// api_base exists for the update e2e (and any dev harness): point a managed test root at
// a local fake GitHub. The repo identity itself stays baked in from package.json.
const UpdateConfigSchema = z.object({
  api_base: z.string().default("https://api.github.com"),
  /**
   * Harness/dev only: versions treated as though a migration shipped in them, so the
   * downgrade gate and its UI can be exercised without a real schema change. GATE-ONLY
   * on purpose: these never run and never touch user_version, so removing them cannot
   * strand a database.
   */
  fake_migration_versions: z.array(z.string()).default([]),
});

export const AppConfigSchema = z.object({
  puppets: z.array(ConfigFilePuppetSpecificSchema), // TODO: Autoderive short name from ID? (Without the lowercase conversion)
  web: WebServerConfigSchema.default(WebServerConfigSchema.parse({})),
  views: ViewManagerConfigSchema.default(ViewManagerConfigSchema.parse({})),
  update: UpdateConfigSchema.default(UpdateConfigSchema.parse({})),
});


export type AppConfig = z.infer<typeof AppConfigSchema>;

