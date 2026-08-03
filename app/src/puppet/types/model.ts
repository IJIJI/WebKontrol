import type { ConnectionState } from "../../types/CommonTypes";
import type { BasePuppetConfig, PuppetRuntime } from "./schema";
import type { EntityAppearance } from "../../common/entityAppearance/schema";

/**
 * This file contains all model definitions for the puppets. That means types that don't need validation.
 * Those are types that are internally created, and can be blindly trusted to be valid.
 */

// Puppet's target info.
export type OgTargetInfo = {
  title?: string;
  description?: string;
  image?: string;
};

export type TargetInfo = {
  title?: string;
  description?: string;
  og?: OgTargetInfo;
  url?: string;
  screenshot?: string;
};

// Puppet runtime info
export interface PuppetInfo {
  state: ConnectionState;
  target_info?: TargetInfo;
}


export interface PuppetDataBundle {
  runtime: PuppetRuntime;
  info: PuppetInfo;
  config: BasePuppetConfig;
  appearance: EntityAppearance;
}