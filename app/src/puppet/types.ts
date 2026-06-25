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
  // display: number; // TODO Implement
}
