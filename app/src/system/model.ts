import type { SystemConfig } from "./schema";

export interface SystemInfo {
  start_moment: number;
}

export interface SystemBundle {
  info: SystemInfo;
  config: SystemConfig;
}
