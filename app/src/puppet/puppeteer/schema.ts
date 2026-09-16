import z from "zod";
import { extendPuppetConfig } from "../types/schema";

// Where the browser window goes, in desktop pixels. Honoured on X11 only (Wayland lets
// no client place its own window). Multi-monitor: a screen's origin is its offset in
// the combined desktop, as printed by `xrandr` (e.g. DSI-1 800x480+1920+0 is x: 1920).
export const PuppeteerPuppetWindowConfigSchema = z.object({
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const PuppeteerPuppetConfigSchema = extendPuppetConfig("puppeteer",{
  chromiumExecutablePath: z.string().optional(),
  window: PuppeteerPuppetWindowConfigSchema.optional(),
  // TODO: Add settings to choose browser (chrome / firefox)
});

export type PuppeteerPuppetConfig = z.infer<
  typeof PuppeteerPuppetConfigSchema
>;
export type PuppeteerPuppetConfigInput = z.input<
  typeof PuppeteerPuppetConfigSchema
>;
