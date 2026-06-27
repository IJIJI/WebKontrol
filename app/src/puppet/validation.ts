import z from "zod";
import { PuppeteerPuppetConfigSchema, PuppeteerPuppetSpecificConfigSchema } from "./puppeteer/schema";

export const IncomingPuppetSpecificConfigSchema = z.discriminatedUnion("type", [
  PuppeteerPuppetSpecificConfigSchema,
]);

export type AnyPuppetSpecificConfig = z.infer<typeof IncomingPuppetSpecificConfigSchema>;

export const ConfigFilePuppetSchema = z.preprocess(
  (data) => (typeof data === 'object' && data !== null && !('type' in data))
    ? { ...data, type: 'puppeteer' }
    : data,
  IncomingPuppetSpecificConfigSchema
);

export const IncomingPuppetConfigSchema = z.discriminatedUnion("type", [
  PuppeteerPuppetConfigSchema,
]);

export type AnyPuppetConfig = z.infer<typeof IncomingPuppetConfigSchema>;