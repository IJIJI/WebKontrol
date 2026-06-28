import z from "zod";
import { extendPuppetConfig, extendPuppetSpecificConfig } from "../schema";

export const PuppeteerPuppetSpecificConfigSchema = extendPuppetSpecificConfig(
  "puppeteer",
  {
    chromiumExecutablePath: z.string().optional(),
    // TODO: Add settings to choose browser (chrome / firefox)
  },
);

export type PuppeteerPuppetSpecificConfig = z.infer<
  typeof PuppeteerPuppetSpecificConfigSchema
>;
export type PuppeteerPuppetSpecificConfigInput = z.input<
  typeof PuppeteerPuppetSpecificConfigSchema
>;

export const PuppeteerPuppetConfigSchema = extendPuppetConfig("puppeteer", {
  specific: PuppeteerPuppetSpecificConfigSchema,
});

export type PuppeteerPuppetConfig = z.infer<typeof PuppeteerPuppetConfigSchema>;
export type PuppeteerPuppetConfigInput = z.input<
  typeof PuppeteerPuppetConfigSchema
>;
