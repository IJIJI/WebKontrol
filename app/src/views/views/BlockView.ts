import type { ServeResult } from "../types/model";
import type { BlockViewConfig } from "../types/schema";
import { AbstractView } from "./AbstractView";

// Renders its single root block tree as a page (client-side).
export class BlockView extends AbstractView<BlockViewConfig> {
  serve(): ServeResult {
    return { kind: "blocks", root: this._config.root };
  }
}
