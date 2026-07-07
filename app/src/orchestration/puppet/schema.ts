import z from "zod";
import { PuppetRuntimeSchema } from "../../puppet/types/schema";


export const PuppetOrchestratorRuntimeSchema = z.object({
  default_runtime: PuppetRuntimeSchema,
});

export type PuppetOrchestratorRuntime = z.infer<typeof PuppetOrchestratorRuntimeSchema>;
export type PuppetOrchestratorRuntimeInput = z.input<typeof PuppetOrchestratorRuntimeSchema>;