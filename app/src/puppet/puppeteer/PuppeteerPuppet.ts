import { execFileSync, type ChildProcess } from "node:child_process";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { AbstractPuppet } from "../AbstractPuppet";
import { KnownFailure, NavigationFailure, NavigationState, type TargetInfo } from "../types/model";
import { type PuppeteerPuppetConfig } from "./schema";
import { BLANK_NAVIGATION_REQUEST, type NavigationRequest } from "../types/schema";
import { ConnectionState } from "../../types/CommonTypes";
import { classifyNavigationFailure } from "./failures";

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
      // The app owns shutdown (app.ts walks close() on SIGINT/SIGTERM). Puppeteer's own
      // handlers force-kill the browser tree and process.exit, racing the graceful
      // close: the loser taskkills already-dead processes and logs errors for a stop.
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
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
    const browser = this._browser;

    // From here the browser exists: a failure below would leave init FAILED with an
    // orphaned Chromium that close() never reaches (its guard sees a never-inited
    // puppet), so close what we launched before rethrowing.
    try {
      // A puppet is only alive while its browser is. Without this a crashed Chromium
      // keeps reporting Online and the orchestrator goes on navigating a dead process.
      // Bound to this browser, like every page listener is bound to its page: a replaced
      // browser dies eventually, and its death is not the running one's business.
      browser.on("disconnected", () => {
        if (browser !== this._browser) return; // a previous browser, already replaced
        if (this._isClosing) return; // a shutdown we asked for is not a crash
        this._setConnection(ConnectionState.OFFLINE, "Browser disconnected.");
      });

      // Reuse the browser's initial tab; fall back to a new one if it opened without any.
      const [firstPage] = await this._browser.pages();
      await this._createPage(firstPage);
    } catch (error) {
      await this._doClose().catch(() => { }); // same teardown a real close does, orphan guard included
      throw error;
    }
  }

  protected async _doClose(): Promise<void> {
    // Taken before closing: close() disposes the connection this handle comes from.
    const proc = this._browser.process();

    // A disconnected browser cannot be asked to quit, so puppeteer falls back to its own
    // kill path, which deletes the temporary profile FIRST: that delete throws on the files
    // the live Chromium still holds, and the kill on the next line never runs, leaving a
    // kiosk window on the display with nothing driving it (observed after a host hibernate,
    // 2026-08-16). Killing first lets that same cleanup run against a dead process instead,
    // which best-effort takes the profile directory with it.
    if (!this._browser.connected) this._killBrowser(proc);

    try {
      await this._browser.close();
    } finally {
      this._killBrowser(proc); // a graceful close that did not end the process
    }
  }

  /**
   * Make sure the browser process is gone. Never trust close() for this: its only handle on
   * the browser is the CDP connection, which is exactly what is missing whenever a browser
   * dies on us rather than at our request.
   */
  private _killBrowser(proc: ChildProcess | null): void {
    if (!proc?.pid || proc.exitCode !== null || proc.signalCode !== null) return;

    this._logger.warn(`Browser process ${proc.pid} outlived its close; killing it.`);
    try {
      if (process.platform === "win32") {
        // Chromium's renderer and GPU children are processes of their own, and killing the
        // parent on Windows leaves them running: /T takes the tree, /F skips asking.
        execFileSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        // Puppeteer launches detached off Windows, so the browser leads its own process
        // group and the negated pid takes the group with it.
        process.kill(-proc.pid, "SIGKILL");
      }
    } catch (error) {
      // Missing permissions, a pid that exited in between, or no process group to speak of.
      // The plain kill leaves any children behind, but the browser itself still goes.
      this._logger.warn(`Could not kill the process tree of ${proc.pid}, killing the process alone.`, error);
      proc.kill("SIGKILL");
    }
  }

  /**
   * Open the page this puppet drives, and wire everything that belongs to a page rather
   * than to the browser. Separate from _doInit because the page can die on its own and
   * has to be rebuilt without relaunching Chromium.
   *
   * @param page - An existing page to adopt. Repairs pass nothing, so they can never
   *   adopt back the very page they are replacing.
   */
  private async _createPage(adopt?: Page): Promise<void> {
    // Every listener below is bound to this variable and opens by checking it is still
    // the live page: a replaced page whose close failed keeps emitting, and without the
    // guard its handlers would act on the replacement's behalf (a dead page's crash
    // handler scheduling a repair of the healthy one).
    const page = adopt ?? (await this._browser.newPage());
    this._page = page;

    const client = await page.createCDPSession();
    await client.send("Emulation.setDefaultBackgroundColorOverride", {
      color: { r: 0, g: 0, b: 0, a: 1 },
    });
    // TODO: Load defaults from some central place?

    // Set screen size.
    // await this.page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});

    // Nothing else dismisses these, and an open dialog blocks both the display and every
    // later navigation, so one alert() from a page would hang the puppet for good.
    page.on("dialog", (dialog) => {
      if (page !== this._page) return;
      this._logger.info(`Dismissed ${dialog.type()} dialog: ${dialog.message()}`);
      void dialog.dismiss().catch(() => { }); // TODO: Add failed dismiss handeling, the catch is already there.
    });

    // A popup is a tab the puppet does not drive, sitting on top of the one it does.
    page.on("popup", (popup) => {
      if (page !== this._page) return;
      this._logger.info("Closed a popup opened by the page.");
      void popup?.close().catch(() => { }); // TODO: Add failed close handeling, the catch is already there.
    });

    // The renderer died while the tab object lived on: the machinery broke (connection
    // ERROR), and whatever was loaded is gone (navigation FAILED, when something was).
    // An in-flight navigation owns its own outcome: it will hit the dead page, report,
    // and its retry path owns recovery, so only an idle puppet schedules the repair.
    page.on("error", (error) => {
      if (page !== this._page) return;
      this._logger.error("Renderer crashed.", error);

      const failure = new KnownFailure(NavigationFailure.PUPPET, "Renderer crashed.", undefined, { cause: error });
      this._setConnection(ConnectionState.ERROR, failure);
      if (this._isNavigating) return;

      const navigation = this._info.navigation;
      if (navigation.state !== NavigationState.IDLE)
        this._setNavigation({ state: NavigationState.FAILED, request: navigation.request, error: failure });

      this._requestRepair();
    });

    // Navigations nobody asked for: a link click, a redirect, a meta refresh. The URL is
    // already right at commit but the document is not parsed yet, so the title only
    // becomes readable on load. Two listeners because they carry different halves.
    page.on("framenavigated", (frame) => {
      if (page !== this._page || frame !== page.mainFrame() || this._isNavigating) return;
      void this._refreshTargetInfo();
    });
    page.on("load", () => {
      if (page !== this._page || this._isNavigating) return;
      void this._refreshTargetInfo();
    });

    // A new tab is not guaranteed focus, and in kiosk mode an unfocused tab means the
    // display keeps showing the dead one this replaces.
    await page.bringToFront();
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

    // Not awaited: a wedged renderer can hang the close forever, and only the new page
    // is needed. The cost is a lingering dead tab behind the live one.
    void this._page.close().catch(() => { });

    await this._createPage();
  }

  protected override async _doRepair(): Promise<void> {
    void this._page.close().catch(() => { }); // same reasoning as _ensurePage
    await this._createPage();
  }

  protected override async _doShowFallback(html: string): Promise<void> {
    await this._ensurePage();
    // A failed goto leaves Chromium still committing its own error page, and setContent
    // evaluates against the document that commit destroys ("Execution context was
    // destroyed"). Navigating to blank first supersedes the pending commit, latest wins
    // inside the browser too, so setContent writes into a settled document.
    await this._page.goto("about:blank");
    await this._page.setContent(html);
  }

  protected override _classifyFailure(error: unknown): NavigationFailure {
    return classifyNavigationFailure(error, this._isPageUsable());
  }

  protected async _doNavigate(request: NavigationRequest): Promise<void> {
    await this._ensurePage();

    const response = await this._page.goto(request.target, { timeout: request.load_timeout });

    // goto only rejects on network level failures and timeouts, so a 404 or a 500 would
    // otherwise report as loaded while the screen shows the server's error page. A null
    // response means no navigation happened at all (same document, or about:blank).
    // >= 400 rather than !ok(): ok() is 2xx only, and a 304 (Express auto-ETags, so
    // revisiting a cached view revalidates) is a success the browser renders from cache.
    if (response && response.status() >= 400) {
      const text = response.statusText(); // empty on HTTP/2, which has no reason phrases
      throw new KnownFailure(
        NavigationFailure.STATUS,
        `Target responded ${response.status()}${text ? ` ${text}` : ""}`,
        response.status(),
      );
    }
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
