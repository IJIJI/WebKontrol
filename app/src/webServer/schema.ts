import z from "zod";
import { ViewKeySchema } from "../views/types/schema";
import { PuppetRuntimeShape } from "../puppet/types/schema";
import { EntityAppearanceSchema } from "../common/entityAppearance/schema";

const SseConfigSchema = z.object({
  ping_interval: z.number().min(500).max(25_000).default(1000),
});

export const WebServerConfigSchema = z.object({
  port: z.number().gte(0).lte(65535).default(80),
  sse: SseConfigSchema.default(SseConfigSchema.parse({})),
});

export type WebServerConfig = z.infer<typeof WebServerConfigSchema>;
export type WebServerConfigInput = z.input<typeof WebServerConfigSchema>;


export const ViewKeyPackageShape = z.object({
  view: ViewKeySchema,
})

// Body of PATCH /api/puppets/:id — the puppet's mutable runtime fields plus its appearance.
export const PuppetPatchSchema = PuppetRuntimeShape.partial().extend({
  appearance: EntityAppearanceSchema.optional(),
});