import fs from "node:fs";
import { asset, IS_PROD } from "../../helpers/assets";
import { Logger } from "../../logging/Logger";

// The host page and stylesheet live next to this file's source; the bundle is produced from
// client/main.ts. All resolved through asset(), so the same relative paths work from the
// source tree (dev) and from dist/ (prod, mirrored there by scripts/assembleDist.ts).
// TODO: Sync paths between ViewServer and BlockViewClient
const HOST_HTML = "views/client/index.html";
const VIEW_CSS = "views/client/view.css";
const PREBUILT_BUNDLE = "views/client/bundle.js";

/**
 * The browser renderer app for block views: the static host page and the browser bundle.
 * ViewServer holds one and serves both. Block-specific by nature — url views redirect and
 * have no client app — hence the name.
 *
 * The bundle has two sources. In dev it is compiled at startup (edit a block, restart, see
 * it). In prod it was compiled by the build (assembleDist) and is read from disk: esbuild
 * stays out of the runtime entirely, and a broken view client fails the build instead of
 * 503ing at a customer. Prod deliberately never falls back to compiling: a missing bundle
 * there means a broken build, and hiding that behind a silent compile would mask it.
 */
export class BlockViewClient {
  private _logger = new Logger(["VIEW", "CLIENT"]);
  private _hostHtml: string | undefined;
  private _stylesheet: string | undefined;
  private _bundle: string | null = null;

  /**
   * Obtain the browser bundle once. A failure is logged and leaves the bundle
   * unavailable (block views then 503) rather than taking down the app; in dev restart to
   * rebuild after fixing the source, in prod rebuild the deployment.
   */
  async build(): Promise<void> {
    try {
      if (IS_PROD) {
        this._bundle = fs.readFileSync(asset(PREBUILT_BUNDLE), "utf8");
        this._logger.info("Loaded the prebuilt view client bundle.");
      } else {
        // Imported lazily so the prod bundle never touches ./build (and through it
        // esbuild, which deployments do not install).
        const { buildViewClient } = await import("./build");
        this._bundle = await buildViewClient();
        this._logger.info("Built the view client bundle.");
      }
    } catch (error) {
      this._logger.error("Failed to obtain the view client bundle; block views will 503:", error);
      this._bundle = null;
    }
  }

  /** The static host page HTML that boots the bundle. Cached on first read. */
  getHostHtml(): string {
    this._hostHtml ??= fs.readFileSync(asset(HOST_HTML), "utf8");
    return this._hostHtml;
  }

  /** The default view stylesheet the host page links. Cached on first read. */
  getStylesheet(): string {
    this._stylesheet ??= fs.readFileSync(asset(VIEW_CSS), "utf8");
    return this._stylesheet;
  }

  /** The browser bundle, or null if obtaining it failed. */
  getBundle(): string | null {
    return this._bundle;
  }
}
