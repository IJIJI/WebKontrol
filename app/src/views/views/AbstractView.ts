import { EventEmitter } from "node:stream";
import type { ViewConfig } from "../types/schema";

// TODO: Split and move into schema and model files
export type ViewType = string;
export type ViewIndex = string;
export type ViewId = {
  type: ViewType;
  index: ViewIndex;
};
export type ViewKey = `${ViewType}::${ViewIndex}`;


export type ViewEvents = {
  load_fail: [];
  load_success: [];
};

export abstract class AbstractView<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for the per-view config type; wired up when views are implemented (#9).
  TConfig extends ViewConfig = ViewConfig,
  TEvents extends ViewEvents & Record<string, unknown[]> = ViewEvents,
> extends EventEmitter<TEvents> {}
