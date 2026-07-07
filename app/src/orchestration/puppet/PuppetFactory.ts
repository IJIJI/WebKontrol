import type { AbstractPuppet } from "../../puppet/AbstractPuppet";
import { PuppeteerPuppet } from "../../puppet/puppeteer/PuppeteerPuppet";
import type { AnyPuppetConfig } from "../../puppet/types/validation";


export class PuppetFactory {

  public static createPuppet(config: AnyPuppetConfig): AbstractPuppet {
    switch (config.type) {
      case "puppeteer":
        return new PuppeteerPuppet(config);
        break;
      default:
        throw new Error("Could not find given puppet type!");
    }
  }
}