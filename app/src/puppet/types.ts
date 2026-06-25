import type { ConnectionState } from "../types/CommonTypes";

export type PuppetKey = string;
export type PuppetTarget = string;

// Info inside a puppet
export interface PuppetInfo {
  state: ConnectionState;
  target_info?: TargetInfo;
}

// Info from inside a puppet, plus info loaded in from other fields like config
export interface PuppetInfoBundle extends PuppetInfo {
  target_url: PuppetTarget;
}

export type TargetInfo = {
  title?: string;
  description?: string;
  og?: OgTargetInfo;
};

export type OgTargetInfo = {
  title?: string;
  description?: string;
  image?: string;
};

// TODO: Look at these types. Are they going to have more fields? If not, is it really needed? Errors can also just be thrown and caught by caller?
export type SetTargetFail = {
  success: false;
  error?: Error;
};

export type SetTargetSuccess = {
  success: true;
};

export type SetTargetResult = SetTargetSuccess | SetTargetFail;

export interface PuppetConfig {
  id: string;
  name: string;
  target_url: PuppetTarget;
  load_wait: number;
  // display: number; // TODO Implement
}


export interface PuppetScreenshotSuccess {
  success: true;
  path: string; // TODO: Probably implement a file storage class that handles saving and overwriting images by id?
}

export interface PuppetScreenshotFail {
  success: false;
  error?: Error;
}

export type PuppetScreenshotResult = PuppetScreenshotSuccess | PuppetScreenshotFail;