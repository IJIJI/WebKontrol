import { Logger } from "./logging/Logger";
import type { AbstractPuppet } from "./puppet/AbstractPuppet";
import { PuppeteerPuppet } from "./puppet/PuppeteerPuppet";
import type { PuppetKey } from "./puppet/types";
import { CoreDatabase } from "./storage/CoreDatabase";

export interface CoreInfo {
  startTime: number;
}

export class AppCore {
  private logger = new Logger(["CORE"]);

  private puppets: Map<PuppetKey, AbstractPuppet> = new Map();

  private info: CoreInfo = {
    startTime: Date.now(),
  };

  constructor() {}

  public async start() {
    this.logger.important("Starting AppCore...");

    const testpuppet = new PuppeteerPuppet({
      id: "test",
      name: "Test Puppet",
      target_url: "https://example.com",
    });

    await testpuppet.init();

    const testdb = CoreDatabase.getInstance();

    await testdb.updateSetting("test_key", "https://synapt.net/contact.php");


    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testpuppet.setTarget("https://synapt.net/");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testpuppet.setTarget("https://synaapt.net/");

    this.puppets.set(testpuppet.getConfig().id, testpuppet);
  }
}

