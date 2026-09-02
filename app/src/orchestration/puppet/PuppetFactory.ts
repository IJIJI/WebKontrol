import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import { PuppeteerPuppet } from "../../puppet/puppeteer/PuppeteerPuppet";
import type { AnyPuppetConfig } from "../../puppet/types/validation";


export class PuppetFactory {

  public static createPuppet(config: AnyPuppetConfig): AbstractPuppet {
    switch (config.type) {
      case "puppeteer":
        return new PuppeteerPuppet(config);
      default:
        throw new Error(`Unknown puppet type: ${JSON.stringify((config as { type?: unknown }).type)}`);
    }
  }
}