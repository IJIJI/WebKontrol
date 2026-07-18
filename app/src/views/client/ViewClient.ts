import fs from "node:fs";
import path from "node:path";
import { buildViewClient } from "./build";
import { Logger } from "../../logging/Logger";

// The host page lives next to this file; the bundle is produced from client/main.ts.
const HOST_HTML = path.join(process.cwd(), "src", "views", "client", "index.html");

/**
 * Owns the browser renderer app: the static host page and the esbuild-built bundle.
 * ViewManager holds one and wires the routes to it, keeping every "serve the client app"
 * concern (build + hold + expose) together under client/.
 */
export class ViewClient {
  private _logger = new Logger(["VIEW", "CLIENT"]);
  private _hostHtml: string | undefined;
  private _bundle: string | null = null;

  /**
   * Build the browser bundle once. A failure is logged and leaves the bundle
   * unavailable (block views then 503) rather than taking down the app; restart to
   * rebuild after fixing the source.
   */
  async build(): Promise<void> {
    try {
      this._bundle = await buildViewClient();
      this._logger.info("Built the view client bundle.");
    } catch (error) {
      this._logger.error("Failed to build the view client bundle; block views will 503:", error);
      this._bundle = null;
    }
  }

  /** The static host page HTML that boots the bundle. Cached on first read. */
  getHostHtml(): string {
    this._hostHtml ??= fs.readFileSync(HOST_HTML, "utf8");
    return this._hostHtml;
  }

  /** The built browser bundle, or null if the build failed. */
  getBundle(): string | null {
    return this._bundle;
  }
}
