import puppeteer, { Browser, Page } from "puppeteer";
import { AbstractPuppet } from "./AbstractPuppet";

export class Puppet extends AbstractPuppet {
  private browser!: Browser;
  private page!: Page;

  private chromiumLocation: string | undefined;

  constructor(chromiumLocation: string | undefined = undefined) {
    super();
    this.chromiumLocation = chromiumLocation;
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

    if (this.chromiumLocation) {
      settings.executablePath = this.chromiumLocation;
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
