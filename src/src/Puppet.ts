import puppeteer, {Browser, Page} from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';
import { EventEmitter } from "events";

export interface PuppetEvents {
  failedLoad: () => void;
  successLoad: () => void;
}

export declare interface Puppet {
  on<U extends keyof PuppetEvents>(
    event: U, listener: PuppetEvents[U]
  ): this;

  emit<U extends keyof PuppetEvents>(
    event: U, ...args: Parameters<PuppetEvents[U]>
  ): boolean;
}

export class Puppet extends EventEmitter {

  private browser: Browser;
  private page: Page;

  constructor() {
    super();

  }

  async init() {
    // Launch the browser and open a new blank page
    this.browser = await puppeteer.launch({
      headless: false, // extension are allowed only in head-full mode
      args: [
          // `--disable-extensions-except=${extensionPath}`, // Full path only
          // `--load-extension=${extensionPath}`,
          // '--disable-extensions',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--start-maximized",
          "--start-fullscreen",
      ],
      // timeout: 0
    });

    this.page = await this.browser.pages().then(pages => pages[0]);

    // Navigate the page to a URL.
    await this.openPage('http://127.0.0.1/clock');

    // Set screen size.
    await this.page.setViewport({width: 1920, height: 1080});

    console.log('Puppet initialized');
  }
  

  async openPage(url: string = 'http://127.0.0.1/clock') 
  {
    try
    {
      await this.page.goto(url);
      this.emit('successLoad');
    }
    catch (e)
    {
      this.emit('failedLoad');
    }
  }
}
