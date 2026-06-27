import puppeteer, { type Browser, type Page } from "puppeteer";
import { AbstractPuppet } from "../AbstractPuppet";
import type { WithRequired } from "../../types/CommonTypes";
import type { PuppetInfo, TargetInfo } from "../model";
import type { PuppetConfig, PuppetTarget } from "../schema";

export interface PuppeteerPuppetConfig extends PuppetConfig {
  chromiumExecutablePath?: string;
  // TODO: Add settings to choose browser
}

// TODO: Implement puppeteer info or remove.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PuppeteerPuppetInfo extends PuppetInfo {
  // Runtime
}

export class PuppeteerPuppet extends AbstractPuppet {
  declare protected _config: PuppeteerPuppetConfig; // Declare to indicate it overwrites the parent's type.

  protected override _getLogLabels(): Array<string> {
    return ["PPT", "Puppeteer"];
  }

  declare protected _info: PuppeteerPuppetInfo; // Declare to indicate it overwrites the parent's type.

  public static readonly DefaultConfig: Omit<PuppetConfig, "id"> = {
    ...AbstractPuppet.DefaultConfig,
    name: "Puppeteer Puppet",
  };

  private _browser!: Browser;
  private _page!: Page;

  constructor(config: WithRequired<PuppeteerPuppetConfig, "id">) {
    super({...PuppeteerPuppet.DefaultConfig, ...config}); // TODO: Better default config handeling?
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

    // Navigate the page to a URL.
    // TODO: Load defaults from some central place?

    // Set screen size.
    // await this.page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});
  }

  protected async _doSetTarget(target: PuppetTarget): Promise<void> {
    await this._page.goto(target, {timeout: this._config.load_wait});
  }

  protected async _getTargetInfo(): Promise<TargetInfo> {
    
    const result: TargetInfo = {};
    
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

  protected override async _doScreenshot(path: string): Promise<void> {
    await this._page.screenshot({
      path: path,
    });
  }

}
