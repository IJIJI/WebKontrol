import EventEmitter from "node:events";
import type { ServeResult } from "../types/model";
import type { ViewConfig, ViewKey } from "../types/schema";

export type ViewEvents = {
  updated: []; // config changed; the orchestrator reloads puppets showing this view
};

export abstract class AbstractView<TConfig extends ViewConfig = ViewConfig> extends EventEmitter<ViewEvents> {
  constructor(
    readonly key: ViewKey,
    protected _config: TConfig,
  ) {
    super();
  }

  getConfig(): TConfig {
    return this._config;
  }

  update(config: TConfig): void {
    this._config = config;
    this.emit("updated");
  }

  /** How this view's /view/:key path responds (render vs redirect). The only per-type behaviour. */
  abstract serve(): ServeResult;
}
