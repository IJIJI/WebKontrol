import { Logger } from "./logging/Logger";
import type { AbstractPuppet } from "./puppet/AbstractPuppet";
import { PuppeteerPuppet } from "./puppet/puppeteer/PuppeteerPuppet";
import { PuppeteerPuppetConfigSchema, PuppeteerPuppetSpecificConfigSchema, type PuppeteerPuppetSpecificConfig } from "./puppet/puppeteer/schema";
import { type PuppetRuntimeConfig, type PuppetKey, type PuppetGlobalConfigInput, PuppetRuntimeConfigSchema, type PuppetRuntimeConfigInput } from "./puppet/schema";
import { CoreDatabase } from "./storage/CoreDatabase";
import type { SystemConfig } from "./system/schema";
import { WebServer } from "./webServer/WebServer";

export interface CoreInfo {
  startTime: number;
}

export class AppCore {

  private _logger = new Logger(["CORE"]);

  private _webServer: WebServer;
  private _puppets: Map<PuppetKey, AbstractPuppet> = new Map();

  private _info: CoreInfo = {
    startTime: Date.now(),
  };

  constructor() {
    this._webServer = new WebServer({});
  }

  public async start(): Promise<void> {
    this._logger.important("Starting AppCore...");

    // this._registerShutdownHandlers(); // TODO
    
    // TODO: Or remove, something to manage puppets is not really needed as they are fixed config, probably a factory? Also some sort of orchestrator to coordinate mutations?
    // TODO: Although, once there is more complex config it might be nice?
    // try {
    //   await this.lifecycle.boot();
    // } catch (error) {
    //   this.logger.fatal("Failed to start Lifecycle.", error);
    // }

    try {
      this._wireWebServer();

      this._webServer.start();

    } catch (error) {
        this._logger.fatal("Failed to start WebServer.", error);
    }

    //* Test code
    const globalPuppetConfig: PuppetGlobalConfigInput = {
      load_timout: undefined
    };
    const defaultRuntimeConfig: PuppetRuntimeConfig = PuppetRuntimeConfigSchema.parse({
      target_url: "https://etsy.com/"
    });

    const specificConfig: PuppeteerPuppetSpecificConfig = PuppeteerPuppetSpecificConfigSchema.parse({
      id: "pup1",
    })

    // Should have try catch in prod
    const testPuppetConfig = PuppeteerPuppetConfigSchema.parse({
      specific: specificConfig,
      global: globalPuppetConfig,
      runtime: defaultRuntimeConfig
    });

    const testpuppet = new PuppeteerPuppet(testPuppetConfig);

    await testpuppet.init();

    const testdb = CoreDatabase.getInstance();

    const key: string = "1";

    const currentValue = await testdb.getSetting("test", "website", key);
    if (!currentValue) {
      // await testdb.updateSetting("test", "website", key, "https://synapt.net/contact.php");
      await testdb.updateSetting("test", "website", key, "https://example.com/");
    }

    this._logger.important("Stored URL:", await testdb.getSetting("test", "website", key));

    const screenshot = await testpuppet.getScreenshot();
    if (screenshot.success) {
      this._logger.important("Screenshot saved at:", screenshot.path);
    } else {
      this._logger.error("Screenshot failed:", screenshot.error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testpuppet.updateRuntime({
      target_url: "https://synapt.nl/"
    });    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testpuppet.updateRuntime({
      target_url: "https://youtube.com/"
    });


    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.exit(0);
    //* END Test code

    // this._puppets.set(testpuppet.getKey(), testpuppet);

  }

  private _wireWebServer(): void {
    const syncState = () => {
      this._webServer.setState({
          puppets: this._puppets.values().map((puppet) => puppet.getInfo()).toArray(),
          system: {
            info: {
              start_moment: Date.now(), // TODO: Track start time and load in from somewhere. system.info in AppCore? Maybe split between runtime and hardware?
            },
            config: {
              system_name: "WebKontrol", // TODO: Load system info and config in from somewhere?
            }
          }
      });
    };

    // TODO: Wire in puppets, or better, an orchestrator to call syncstate.

    syncState();

    this._webServer.setHandlers({
      puppet: {
        setRuntime: async (id: PuppetKey, runtime: PuppetRuntimeConfigInput): Promise<void> => {

        }
      },
      system: {
        setConfig: async (config: SystemConfig): Promise<void> => {

        },

        update: {
          check: async (): Promise<void> => {

          },
          apply: async (ref: string, type: 'release' | 'branch'): Promise<void> => {

          },
          getStatus: async (): Promise<void> => {

          }
        }
      }
    })
  }
}

