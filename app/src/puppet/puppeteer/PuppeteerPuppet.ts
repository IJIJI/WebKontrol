import puppeteer, { type Browser, type Page } from "puppeteer";
import { AbstractPuppet } from "../AbstractPuppet";
import type { TargetInfo } from "../types/model";
import { type PuppeteerPuppetConfig } from "./schema";
import type { PuppeteerPuppetInfo } from "./model";
import type { PuppetTarget } from "../types/schema";

export class PuppeteerPuppet extends AbstractPuppet<PuppeteerPuppetConfig> {
  protected override _getLogLabelExtensions(): Array<string> {
    return ["Puppeteer"];
  }

  declare protected _info: PuppeteerPuppetInfo; // Declare to indicate it overwrites the parent's type.

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

    // TODO: Docs use await broser.newPage(); Check which is better.
    this._page = await this._browser.pages().then((pages) => pages[0]);

    const client = await this._page.createCDPSession();
    await client.send("Emulation.setDefaultBackgroundColorOverride", {
      color: { r: 0, g: 0, b: 0, a: 1 },
    });
    // Navigate the page to a URL.
    // TODO: Load defaults from some central place?

    // Set screen size.
    // await this.page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});
  }

  protected async _doSetTarget(target: PuppetTarget): Promise<void> {
    await this._page.goto(target, { timeout: this._runtime.load_timout });
  }

  // TODO: Add url and image fetching?
  // TODO: Some callback from puppeteer that runs on page change?
  protected async _getTargetInfo(): Promise<TargetInfo> {
    const result: TargetInfo = {};

    // The final URL after redirects — can differ from the runtime target.
    result.url = this._page.url();

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
