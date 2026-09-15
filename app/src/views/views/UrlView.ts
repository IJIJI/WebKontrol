import type { ServeResult } from "../types/model";
import type { UrlViewConfig } from "../types/schema";
import { AbstractView } from "./AbstractView";

// Redirects the puppet to an external URL (no iframe), with config.parameters as the query string.
export class UrlView extends AbstractView<UrlViewConfig> {
  serve(): ServeResult {
    return { kind: "redirect", url: this._targetUrl() };
  }

  reloadSignature(): string {
    // Re-navigate only when the destination changes (not on e.g. a name-only edit).
    return this._targetUrl();
  }

  private _targetUrl(): string {
    const url = new URL(this._config.url);
    for (const [key, value] of Object.entries(this._config.parameters ?? {})) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }
}
