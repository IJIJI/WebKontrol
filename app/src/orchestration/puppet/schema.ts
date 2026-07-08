import z from "zod";
import { BLANK_PUPPET_TARGET, PuppetRuntimeSchema } from "../../puppet/types/schema";


export const PuppetOrchestratorRuntimeShape = z.object({
  default_runtime: PuppetRuntimeSchema,
});
export const PuppetOrchestratorRuntimeSchema = PuppetOrchestratorRuntimeShape.extend({
  default_runtime: PuppetOrchestratorRuntimeShape.shape.default_runtime.default(BLANK_PUPPET_TARGET),
});

export type PuppetOrchestratorRuntime = z.infer<typeof PuppetOrchestratorRuntimeSchema>;
export type PuppetOrchestratorRuntimeInput = z.input<typeof PuppetOrchestratorRuntimeSchema>;