import puppeteer, { Browser, Page } from "puppeteer";
import { AbstractPuppet } from "./AbstractPuppet";
import type { PuppetConfig, PuppetInfo, PuppetTarget } from "./types";
import type { WithRequired } from "../types/CommonTypes";

export interface PuppeteerPuppetConfig extends PuppetConfig {
  chromiumLocation?: string;
}

export interface PuppeteerPuppetInfo extends PuppetInfo {
  // Runtime
}

export class PuppeteerPuppet extends AbstractPuppet {
  declare protected _config: PuppeteerPuppetConfig; // Declare to indicate it overwrites the parent's type.

  protected override _getLogLabels() {
    return ["PPT", "Puppeteer"];
  }

  declare protected _info: PuppeteerPuppetInfo; // Declare to indicate it overwrites the parent's type.

  public static readonly DefaultConfig: Omit<PuppetConfig, "id"> = {
    ...AbstractPuppet.DefaultConfig,
    name: "Puppeteer Puppet",
  };

  private browser!: Browser;
  private page!: Page;

  constructor(config: WithRequired<PuppeteerPuppetConfig, "id">) {
    super({...PuppeteerPuppet.DefaultConfig, ...config}); // TODO: Better default config handeling?
  }

  protected async _doInit() {
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
      // timeout: 0
    };

    if (this._config.chromiumLocation) {
      settings.executablePath = this._config.chromiumLocation;
    }

    this.browser = await puppeteer.launch(settings);

    // TODO: Docs use await broser.newPage(); Check which is better.
    this.page = await this.browser.pages().then((pages) => pages[0]);

    // Navigate the page to a URL.
    // TODO: Load defaults from some central place?
    await this.setPage("http://127.0.0.1/splash/simple");

    // Set screen size.
    // await this.page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});

    this._logger.info("Puppet initialized");
  }

  protected async _doSetTarget(target: PuppetTarget): Promise<void> {
    await this.page.goto(target);
  }


  async _failedPage(url: string) {
    await this.page.goto("http://127.0.0.1/no_connect");

    await this.delay(30000);

    this.page.goto(url).catch((_reason) => {
      this._failedPage(url);
    });
  }

  async delay(delayInms: number) {
    return new Promise((resolve) => setTimeout(resolve, delayInms));
  }
}
