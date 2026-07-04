import type { CoreRuntimeConfig } from "./schema";

export interface CoreInfo {
  start_moment: number;
}

export interface CoreInfoBundle {
  info: CoreInfo;
  config: CoreRuntimeConfig; // Runtime only.
}
