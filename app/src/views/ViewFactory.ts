import type { AnyViewConfig, ViewKey } from "./types/schema";
import type { AbstractView } from "./views/AbstractView";
import { BlockView } from "./views/BlockView";
import { UrlView } from "./views/UrlView";

// Builds the concrete view instance for a stored config (mirrors PuppetFactory).
export class ViewFactory {
  public static createView(key: ViewKey, config: AnyViewConfig): AbstractView {
    switch (config.type) {
      case "blocks":
        return new BlockView(key, config);
      case "url":
        return new UrlView(key, config);
    }
  }
}
