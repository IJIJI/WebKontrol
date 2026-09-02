import z from "zod";
import { extendPuppetConfig } from "../types/schema";

// TODO: Implement this to be able to configure window locations
// export const PuppeteerPuppetWindowConfigSchema = z.object({
  
// });

export const PuppeteerPuppetConfigSchema = extendPuppetConfig("puppeteer",{
  chromiumExecutablePath: z.string().optional(),
  // TODO: Add settings to choose browser (chrome / firefox)
});

export type PuppeteerPuppetConfig = z.infer<
  typeof PuppeteerPuppetConfigSchema
>;
export type PuppeteerPuppetConfigInput = z.input<
  typeof PuppeteerPuppetConfigSchema
>;
