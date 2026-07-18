import type { ServeResult } from "../types/model";
import type { ViewConfig, ViewKey } from "../types/schema";

// A single view instance: it knows its key + config and how its /view/:key path
// responds. Lifecycle (create/update/delete + events) is owned by the ViewManager.
export abstract class AbstractView<TConfig extends ViewConfig = ViewConfig> {
  constructor(
    readonly key: ViewKey,
    protected _config: TConfig,
  ) {}

  getConfig(): TConfig {
    return this._config;
  }

  /** How this view's /view/:key path responds (render vs redirect). The only per-type behaviour. */
  abstract serve(): ServeResult;

  /**
   * A value that changes iff a puppet showing this view must re-navigate. Compared across an
   * update (old vs new): equal = no puppet reload (e.g. a block view whose content rides the
   * SSE stream, or a url view whose target is unchanged); different = reload.
   */
  abstract reloadSignature(): string;
}
