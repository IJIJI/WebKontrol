import type { PuppetInfo } from "../../puppet/types/model"
import type { BasePuppetConfig, PuppetRuntime } from "../../puppet/types/schema"
import type { PuppetOrchestratorRuntime } from "./schema"

export interface PuppetOrchestratorInfoOutput {
  puppets: PuppetInfo[]
}

export interface PuppetOrchestratorRuntimeOutput {
  runtime: PuppetOrchestratorRuntime;
  puppets: PuppetRuntime[]
}

export interface PuppetOrchestratorConfigOutput {
  puppets: BasePuppetConfig[]
}