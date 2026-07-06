import type { ConnectionState } from "../types/CommonTypes";
import type {
  PuppetRuntimeConfigBase,
  PupppetSpecificConfigBase,
} from "./schema.old";

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
};

// Puppet runtime info
export interface PuppetInfo {
  state: ConnectionState;
  target_info?: TargetInfo;
}

// Puppet runtime info + derived info. e.g. from config.
export interface PuppetInfoBundle extends PuppetInfo {
  config: {
    specific: PupppetSpecificConfigBase;
    runtime: PuppetRuntimeConfigBase;
  };
}

// Puppet execution result types: setTarget
// TODO: Look at these types. Are they going to have more fields? If not, is it really needed? Errors can also just be thrown and caught by caller?
export type SetTargetFail = {
  success: false;
  error?: Error;
};

export type SetTargetSuccess = {
  success: true;
};

export type SetTargetResult = SetTargetSuccess | SetTargetFail;

// Puppet execution result types: getScreenshot
export interface PuppetScreenshotSuccess {
  success: true;
  path: string; // TODO: Probably implement a file storage class that handles saving and overwriting images by id?
}

export interface PuppetScreenshotFail {
  success: false;
  error?: Error;
}

export type PuppetScreenshotResult =
  | PuppetScreenshotSuccess
  | PuppetScreenshotFail;
