import z from "zod";
import {
  PuppeteerPuppetConfigSchema,
} from "../puppeteer/schema";

export const IncomingPuppetConfigSchema = z.discriminatedUnion("type", [
  PuppeteerPuppetConfigSchema,
]);

export type AnyPuppetConfig = z.infer<
  typeof IncomingPuppetConfigSchema
>;


// TODO: Feels brittle. Add type on base config as default puppeteer?
export const ConfigFilePuppetSpecificSchema = z.preprocess(
  (data) =>
    typeof data === "object" && data !== null && !("type" in data)
      ? { ...(data as Record<string, unknown>), type: "puppeteer" }
      : data,
  IncomingPuppetConfigSchema,
);

