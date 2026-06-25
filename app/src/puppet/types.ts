import type { ConnectionState } from "../types/CommonTypes";

export type PuppetKey = string;
export type PuppetTarget = string;

export interface PuppetInfo {
  target: TargetInfo;
  state: ConnectionState;
}

export type TargetInfo = {
  url: PuppetTarget;
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
  info: TargetInfo;
  error?: Error;
};

export type SetTargetSuccess = {
  success: true;
  info: TargetInfo;
};

export type SetTargetResult = SetTargetSuccess | SetTargetFail;

export interface PuppetConfig {
  id: string;
  display: number; // TODO Implement
}
