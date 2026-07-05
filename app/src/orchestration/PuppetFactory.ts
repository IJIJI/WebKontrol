import type { AbstractPuppet } from "../puppet/AbstractPuppet";
import { PuppeteerPuppet } from "../puppet/puppeteer/PuppeteerPuppet";
import type { PuppetGlobalConfig } from "../puppet/schema";
import type { AnyPuppetConfig, AnyPuppetSpecificConfig } from "../puppet/validation";


export class PuppetFactory {

  private _global: PuppetGlobalConfig;

  constructor(global: PuppetGlobalConfig) { // TODO: Add default runtime to globalConfig, so runtime can be excluded from puppetConfig.
    this._global = global;
  }

  private _getFullConfig(config: AnyPuppetSpecificConfig): AnyPuppetConfig {
    return {global: this._global, specific: config}; // TODO: Puppet config should not contain runtime, it is managed by the puppet itself.
  }

  public createPuppet(config: AnyPuppetSpecificConfig): AbstractPuppet {
    switch (config.type) {
      case "puppeteer":
        return new PuppeteerPuppet(this._getFullConfig(config));
    }
  }
}