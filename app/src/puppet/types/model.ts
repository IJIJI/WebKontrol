import type { ConnectionState } from "../../types/CommonTypes";
import type { BasePuppetConfig, NavigationRequest, PuppetRuntime } from "./schema";
import type { EntityAppearance } from "../../common/entityAppearance/schema";

/**
 * This file contains all model definitions for the puppets. That means types that don't need validation.
 * Those are types that are internally created, and can be blindly trusted to be valid.
 */

// Puppet's navigation info: What was requested
export enum NavigationState {
  IDLE = "Idle",       // nothing asked for yet
  LOADING = "Loading",
  LOADED = "Loaded",
  FAILED = "Failed",
}

export interface NavigationInfo {
  state: NavigationState;
  request?: NavigationRequest;
  error?: string;
  moment: number;
}

// Puppet's target info: What was loaded
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
  error?: string; // Why it is not ONLINE. Absent while healthy.
  navigation: NavigationInfo;
  target_info?: TargetInfo;
  moment: number;
}


export interface PuppetDataBundle {
  runtime: PuppetRuntime;
  info: PuppetInfo;
  config: BasePuppetConfig;
  appearance: EntityAppearance;
}