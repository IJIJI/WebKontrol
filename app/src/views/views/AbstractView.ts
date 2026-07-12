import { EventEmitter } from "node:stream";
import type { ViewConfig } from "../types/schema";

export type ViewEvents = {
  load_fail: [];
  load_success: [];
};

export abstract class AbstractView<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for the per-view config type
  TConfig extends ViewConfig = ViewConfig,
  TEvents extends ViewEvents & Record<string, unknown[]> = ViewEvents,
> extends EventEmitter<TEvents> {}
