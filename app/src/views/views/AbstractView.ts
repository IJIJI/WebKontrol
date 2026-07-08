import { EventEmitter } from "node:stream";

// TODO: Split and move into schema and model files
export type ViewType = string;
export type ViewIndex = string;
export type ViewId = {
  type: ViewType;
  index: ViewIndex;
};
export type ViewKey = `${ViewType}::${ViewIndex}`;

export type ViewConfig = {
  name: string;
};

export type ViewEvents = {
  load_fail: [];
  load_success: [];
};

export abstract class AbstractView<
  TConfig extends ViewConfig = ViewConfig,
  TEvents extends ViewEvents & Record<string, unknown[]> = ViewEvents,
> extends EventEmitter<TEvents> {}
