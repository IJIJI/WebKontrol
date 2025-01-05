import puppeteer, {Browser, Page} from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';
import { EventEmitter } from "events";
import { Console } from 'console';

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
      defaultViewport: null,
      ignoreDefaultArgs: ['--enable-automation'],
      // executablePath: '/usr/bin/chromium-browser',
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
        "--force-dark-mode",
        "--kiosk"
      ],
      // timeout: 0
    });
    
    this.page = await this.browser.pages().then(pages => pages[0]);
    
    // Navigate the page to a URL.
    await this.openPage('http://127.0.0.1/splash/simple');
    
    // Set screen size.
    // await this.page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});
    
    console.log('Puppet initialized');
  }
  
  
  async openPage(url: string = 'http://127.0.0.1/clock') 
  {
    try
    {
      await this.page.goto(url).catch((reason) => {
        console.log("Failed loading! Attempting in 30s...");
        this._failedPage(url);
      });
      this.emit('successLoad');
      console.log('Success!');
    }
    catch (e)
    {
      this.emit('failedLoad');
      console.log("Failed loading! ", e);
    }
  }

  async _failedPage(url: string) {

    await this.page.goto('http://127.0.0.1/no_connect');

    await this.delay (30000);

    this.page.goto(url).catch((reason) => {
      this._failedPage(url);
    });
  }

  async delay(delayInms) {
    return new Promise(resolve => setTimeout(resolve, delayInms));
  };
}
