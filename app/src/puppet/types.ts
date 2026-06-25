import type { ConnectionState } from "../types/CommonTypes";

export type PuppetKey = string;
export type PuppetTarget = string;

export interface PuppetInfo {
  state: ConnectionState;
  target_info?: TargetInfo;
}

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
  target_url: PuppetTarget;
  display: number; // TODO Implement
}
