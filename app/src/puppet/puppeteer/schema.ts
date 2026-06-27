import z from "zod";
import { extendPuppetConfig, PuppetConfigSchema, PuppetSpecificConfigSchema } from "../schema";


export const PuppeteerPuppetSpecificConfigSchema = PuppetSpecificConfigSchema.extend({
  chromiumExecutablePath: z.string().optional(),
  // TODO: Add settings to choose browser (chrome / firefox)
});

export type PuppeteerPuppetSpecificConfig = z.infer<typeof PuppeteerPuppetSpecificConfigSchema>;

export const PuppeteerPuppetConfigSchema = extendPuppetConfig("Puppeteer", {
  specific: PuppeteerPuppetSpecificConfigSchema
})

export type PuppeteerPuppetConfig = z.infer<typeof PuppetConfigSchema>;