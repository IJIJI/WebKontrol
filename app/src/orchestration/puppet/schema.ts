import z from "zod";
import { BLANK_PUPPET_TARGET, PuppetKeySchema, PuppetRuntimeSchema } from "../../puppet/types/schema";
import { ViewKeySchema } from "../../views/types/schema";


export const PuppetOrchestratorRuntimeShape = z.object({
  default_runtime: PuppetRuntimeSchema,
  // Which view each puppet shows. Absent key = unassigned (falls back to the default view).
  assignments: z.record(PuppetKeySchema, ViewKeySchema),
});
export const PuppetOrchestratorRuntimeSchema = PuppetOrchestratorRuntimeShape.extend({
  default_runtime: PuppetOrchestratorRuntimeShape.shape.default_runtime.default(BLANK_PUPPET_TARGET),
  assignments: PuppetOrchestratorRuntimeShape.shape.assignments.default({}),
});

export type PuppetOrchestratorRuntime = z.infer<typeof PuppetOrchestratorRuntimeSchema>;
export type PuppetOrchestratorRuntimeInput = z.input<typeof PuppetOrchestratorRuntimeSchema>;