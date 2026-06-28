import z from "zod";
import { PuppeteerPuppetConfigSchema, PuppeteerPuppetSpecificConfigSchema } from "./puppeteer/schema";

export const IncomingPuppetSpecificConfigSchema = z.discriminatedUnion("type", [
  PuppeteerPuppetSpecificConfigSchema,
]);

export type AnyPuppetSpecificConfig = z.infer<typeof IncomingPuppetSpecificConfigSchema>;

export const IncomingPuppetConfigSchema = z.discriminatedUnion("type", [
  PuppeteerPuppetConfigSchema,
]);

export const ConfigFilePuppetSpecificSchema = z.preprocess(
  (data) => (typeof data === 'object' && data !== null && !('type' in data))
    ? { ...(data as Record<string, unknown>), type: 'puppeteer' }
    : data,
  IncomingPuppetSpecificConfigSchema
);

export type AnyPuppetConfig = z.infer<typeof IncomingPuppetConfigSchema>;