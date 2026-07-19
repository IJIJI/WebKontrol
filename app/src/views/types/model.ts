import type { AnyBlockConfig } from "../blocks/types/schema";
import type { AnyViewConfig, ViewKey } from "./schema";

export interface ViewManagerInfo {
  viewCount: number; // TODO Actually usefull info
}

/**
 * Bundle for the frontend/api.
 */
export interface ViewBundle {
  key: ViewKey;
  config: AnyViewConfig;
}

/**
 * What a view's /view/:key path should return, produced by AbstractView.serve()
 * and mapped to an HTTP response by the serving route:
 *   - blocks   => render the root block tree (client-side)
 *   - redirect => 302 the puppet to an external url
 */
// TODO: Check if the base path should be configurable somehow
export type ServeResult =
  | { kind: "blocks"; root: AnyBlockConfig }
  | { kind: "redirect"; url: string };
