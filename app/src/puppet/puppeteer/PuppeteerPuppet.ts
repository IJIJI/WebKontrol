import puppeteer, { type Browser, type Page } from "puppeteer";
import { AbstractPuppet } from "../AbstractPuppet";
import { NavigationState, type TargetInfo } from "../types/model";
import { type PuppeteerPuppetConfig } from "./schema";
import { BLANK_NAVIGATION_REQUEST, type NavigationRequest } from "../types/schema";
import { ConnectionState } from "../../types/CommonTypes";

export class PuppeteerPuppet extends AbstractPuppet<PuppeteerPuppetConfig> {
  protected override _getLogLabelExtensions(): Array<string> {
    return ["Puppeteer"];
  }

  private _browser!: Browser;
  private _page!: Page;

  constructor(config: PuppeteerPuppetConfig) {
    super(config);
  }

  protected async _doInit(): Promise<void> {
    // Launch the browser and open a new blank page

    const settings = {
      headless: false, // extension are allowed only in head-full mode
      defaultViewport: null,
      ignoreDefaultArgs: ["--enable-automation"],
      // executablePath: '/usr/bin/chromium-browser',
      executablePath: <string | undefined>undefined,
      args: [
        // `--disable-extensions-except=${extensionPath}`, // Full path only
        // `--load-extension=${extensionPath}`,
        // '--disable-extensions',
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--start-maximized",
        "--start-fullscreen",
        "--force-dark-mode",
        "--kiosk",
      ],
      // timeout: 0 // Time to wait for browser start
    };

    if (this._config.chromiumExecutablePath) {
      settings.executablePath = this._config.chromiumExecutablePath;
    }

    this._browser = await puppeteer.launch(settings);

    // A puppet is only alive while its browser is. Without this a crashed Chromium keeps
    // reporting Online and the orchestrator goes on navigating a dead process.
    this._browser.on("disconnected", () => {
      if (this._isClosing) return; // a shutdown we asked for is not a crash
      void this._setConnection(ConnectionState.OFFLINE, "Browser disconnected.");
    });

    // Reuse the browser's initial tab; fall back to a new one if it opened without any.
    const [firstPage] = await this._browser.pages();
    await this._createPage(firstPage);
  }

  protected async _doClose(): Promise<void> {
    await this._browser.close();
  }

  /**
   * Open the page this puppet drives, and wire everything that belongs to a page rather
   * than to the browser. Separate from _doInit because the page can die on its own and
   * has to be rebuilt without relaunching Chromium.
   *
   * @param page - An existing page to adopt. Repairs pass nothing, so they can never
   *   adopt back the very page they are replacing.
   */
  private async _createPage(page?: Page): Promise<void> {
    this._page = page ?? (await this._browser.newPage());

    const client = await this._page.createCDPSession();
    await client.send("Emulation.setDefaultBackgroundColorOverride", {
      color: { r: 0, g: 0, b: 0, a: 1 },
    });
    // TODO: Load defaults from some central place?

    // Set screen size.
    // await this.page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});

    // Nothing else dismisses these, and an open dialog blocks both the display and every
    // later navigation, so one alert() from a page would hang the puppet for good.
    this._page.on("dialog", (dialog) => {
      this._logger.info(`Dismissed ${dialog.type()} dialog: ${dialog.message()}`);
      void dialog.dismiss().catch(() => { }); // TODO: Add failed dismiss handeling, the catch is already there.
    });

    // A popup is a tab the puppet does not drive, sitting on top of the one it does.
    this._page.on("popup", (popup) => {
      this._logger.info("Closed a popup opened by the page.");
      void popup?.close().catch(() => { }); // TODO: Add failed close handeling, the catch is already there.
    });

    // The renderer died while the tab object lived on, so whatever was loaded is gone
    // even though the browser is fine. Report it against the request that put it there.
    this._page.on("error", (error) => {
      this._logger.error("Renderer crashed.", error);
      void this._setNavigation(NavigationState.FAILED, this._info.navigation.request, error);
    });

    // Navigations nobody asked for: a link click, a redirect, a meta refresh. The URL is
    // already right at commit but the document is not parsed yet, so the title only
    // becomes readable on load. Two listeners because they carry different halves.
    this._page.on("framenavigated", (frame) => {
      if (frame !== this._page.mainFrame() || this._isNavigating) return;
      void this._updateInfo();
    });
    this._page.on("load", () => {
      if (this._isNavigating) return;
      void this._updateInfo();
    });
  }

  /**
   * Whether the page handle can still be talked to. Every frame method is wrapped in a
   * detached check that throws, so this is the cheap positive test that avoids having to
   * recognise Puppeteer's error strings after the fact.
   */
  private _isPageUsable(): boolean {
    try {
      return this._browser.connected && !this._page.isClosed() && !this._page.mainFrame().detached;
    } catch {
      return false; // probing a torn down page can itself throw
    }
  }

  /**
   * The page can die while the browser lives on: a host sleep, a discarded tab, a renderer
   * crash. Rebuild the handle rather than navigating into a detached frame. A dead browser
   * is deliberately not handled here, newPage() will throw and the navigation reports it,
   * while the disconnect listener separately reports the puppet as offline.
   */
  private async _ensurePage(): Promise<void> {
    if (this._isPageUsable()) return;
    this._logger.warn("Page is unusable, opening a replacement.");

    try {
      await this._page.close();
    } catch {
      // Already gone, or never opened. Either way there is nothing left to close.
    }

    await this._createPage();
  }

  protected async _doNavigate(request: NavigationRequest): Promise<void> {
    await this._ensurePage();

    const response = await this._page.goto(request.target, { timeout: request.load_timeout });

    // goto only rejects on network level failures and timeouts, so a 404 or a 500 would
    // otherwise report as loaded while the screen shows the server's error page. A null
    // response means no navigation happened at all (same document, or about:blank).
    if (response && !response.ok())
      throw new Error(`Target responded ${response.status()} ${response.statusText()}`);
  }

  // TODO: Add url and image fetching?
  // TODO: Some callback from puppeteer that runs on page change?
  protected async _getTargetInfo(): Promise<TargetInfo> {
    // A read must never repair: _ensurePage belongs to navigation, and rebuilding here
    // would throw away whatever is still on the display. Keep the last known info instead
    // of wiping it, since there is nothing new to report.
    if (!this._isPageUsable()) return this.getLastInfo().target_info ?? {};

    // The final URL after redirects can differ from the requested target.
    const url = this._page.url();

    // The blank placeholder has no content to read, and evaluating against it races
    // Chromium recreating the execution context right after navigation resolves.
    if (url === BLANK_NAVIGATION_REQUEST.target) return { url };

    const result: TargetInfo = { url };

    const title = await this._page.title();

    if (title) {
      result.title = title;
    }

    const description = await this._page.evaluate(() => {
      const meta = document.querySelector("meta[name='description']");
      return meta ? meta.getAttribute("content") : "";
    });

    if (description) {
      result.description = description;
    }

    // TODO: OG

    return result;
  }
}
