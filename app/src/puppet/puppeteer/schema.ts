import z from "zod";
import { PuppetConfigSchema, PuppetSpecificConfigSchema } from "../schema";


export const PuppeteerPuppetSpecificConfigSchema = PuppetSpecificConfigSchema.extend({
  chromiumExecutablePath: z.string().optional(),
});

export type PuppeteerPuppetSpecificConfig = z.infer<typeof PuppeteerPuppetSpecificConfigSchema>;

export const PuppeteerPuppetConfigSchema = PuppetConfigSchema.extend({
  specific: PuppeteerPuppetSpecificConfigSchema,
}).brand<"puppeteerConfig">;

export type PuppeteerPuppetConfig = z.infer<typeof PuppetConfigSchema>;