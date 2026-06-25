import puppeteer, { Browser, Page } from "puppeteer";
import { AbstractPuppet } from "./AbstractPuppet";
import type { PuppetConfig } from "./types";

export interface PuppeteerPuppetConfig extends PuppetConfig {
  chromiumLocation?: string;
}

export class PuppeteerPuppet extends AbstractPuppet {
  declare protected _config: PuppeteerPuppetConfig; // Declare to indicate it overwrites the parent's type.

  private browser!: Browser;
  private page!: Page;


  constructor(config: PuppeteerPuppetConfig) {
    super(config);
  }

  async init() {
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
    await this.setPage("http://127.0.0.1/splash/simple");

    // Set screen size.
    // await this.page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});

    console.log("Puppet initialized");
  }

  async setPage(url: string = "http://127.0.0.1/clock") {
    // TODO: Different default? Internal virtual hosts?
    try {
      await this.page.goto(url).catch((_reason) => {
        console.log("Failed loading! Attempting in 30s...");
        this._failedPage(url);
      });
      this.emit("successLoad");
      console.log("Success!");
    } catch (e) {
      this.emit("failedLoad");
      console.log("Failed loading! ", e);
    }
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
