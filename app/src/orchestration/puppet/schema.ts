import z from "zod";
import { PuppetKeySchema } from "../../puppet/types/schema";
import { ViewKeySchema } from "../../views/types/schema";


export const PuppetOrchestratorRuntimeShape = z.object({
  // Which view each puppet shows. Absent key = unassigned (falls back to default_view).
  // NOTE: a runtime update replaces this map wholesale (shallow merge of the runtime object),
  // it does not merge per key, use the assign/unassign routes for single-puppet changes.
  assignments: z.record(PuppetKeySchema, ViewKeySchema),
  // Global fallback view for puppets with no explicit assignment.
  default_view: ViewKeySchema.optional(),
});
export const PuppetOrchestratorRuntimeSchema = PuppetOrchestratorRuntimeShape.extend({
  assignments: PuppetOrchestratorRuntimeShape.shape.assignments.default({}),
});

export type PuppetOrchestratorRuntime = z.infer<typeof PuppetOrchestratorRuntimeSchema>;
export type PuppetOrchestratorRuntimeInput = z.input<typeof PuppetOrchestratorRuntimeSchema>;