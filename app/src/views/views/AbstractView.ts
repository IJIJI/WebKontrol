import EventEmitter from "node:events";
import type { ServeResult } from "../types/model";
import type { ViewConfig, ViewKey, ViewResolveContext, ViewTarget } from "../types/schema";

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

  /**
   * The puppet target for this view: always its own /view/:key path (the server
   * renders or redirects there), plus the effective load timeout. Uniform across
   * all view types - the per-type behaviour lives in serve().
   */
  resolve(ctx: ViewResolveContext): ViewTarget {
    return {
      url: `${ctx.serveBase}/view/${this.key}`,
      loadTimeout: this._config.loadTimeout ?? ctx.defaultLoadTimeout,
    };
  }

  /** How this view's /view/:key path responds (render vs redirect). Per view type. */
  abstract serve(): ServeResult;
}
