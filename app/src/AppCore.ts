import { Logger } from "./logging/Logger";
import type { AbstractPuppet } from "./puppet/AbstractPuppet";
import { type PuppetKey, type PuppetRuntimeConfigInput } from "./puppet/schema";
import { AppCoreStore } from "./storage/AppCoreStore";
import type { SystemInfo } from "./system/model";
import {
  SystemConfigSchema,
  type SystemConfig,
  type SystemConfigInput,
} from "./system/schema";
import { WebServer } from "./webServer/WebServer";

export class AppCore {
  private _logger = new Logger(["CORE"]);

  private _hasStarted: boolean = false;

  private _webServer: WebServer;
  private _puppets: Map<PuppetKey, AbstractPuppet> = new Map();

  private _info: SystemInfo = {
    start_moment: Date.now(),
  };

  private _config: SystemConfig = {
    system_name: "WebKontrol",
  };
  protected _store: AppCoreStore = new AppCoreStore();

  // TODO: This can be massively cleaned up.
  // TODO: Runtime should not be an argument, there should be a config bundle for the "real" runtime unchangable config. e.g. webserver port
  // TODO: Move async code into init function.
  constructor(config?: SystemConfigInput) {
    if (config) {
      this._config = SystemConfigSchema.parse(config);
      this._store
        .saveRuntime(this._config)
        .then(() => {
          if (this._hasStarted) {
            this._syncState();
          }
        })
        .catch((reason) => {
          this._logger.error(
            `Failed overwriting SystemConfig in DB. Reason:`,
            reason,
          );
        });
    } else {
      this._store
        .loadRuntime()
        .then((loaded) => {
          if (loaded) {
            this._config = loaded;
            this._logger.info(`Loaded SystemConfig from DB:`, this._config);
          } else {
            this._logger.important(
              `Could not find SystemConfig in DB. Using default:`,
              this._config,
            );

            this._store.saveRuntime(this._config).catch((reason) => {
              this._logger.error(
                `Failed saving default SystemConfig to DB. Reason:`,
                reason,
              );
            });
          }
          if (this._hasStarted) {
            this._syncState();
          }
        })
        .catch((reason) => {
          this._logger.error(
            `Failed loading config from store. Reason:`,
            reason,
          );
        });
    }

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

      await this._webServer.start();
      this._syncState();
    } catch (error) {
      this._logger.fatal("Failed to start WebServer.", error);
    }

    this._hasStarted = true;

    //* Test code
    // setInterval(() => {
    //   this._syncState();
    // }, 2000);
    //
    // const globalPuppetConfig: PuppetGlobalConfigInput = {
    //   load_timout: undefined
    // };
    // const defaultRuntimeConfig: PuppetRuntimeConfig = PuppetRuntimeConfigSchema.parse({
    //   target_url: "https://etsy.com/"
    // });

    // const specificConfig: PuppeteerPuppetSpecificConfig = PuppeteerPuppetSpecificConfigSchema.parse({
    //   id: "pup1",
    // })

    // // Should have try catch in prod
    // const testPuppetConfig = PuppeteerPuppetConfigSchema.parse({
    //   specific: specificConfig,
    //   global: globalPuppetConfig,
    //   runtime: defaultRuntimeConfig
    // });

    // const testpuppet = new PuppeteerPuppet(testPuppetConfig);

    // await testpuppet.init();

    // const testdb = CoreDatabase.getInstance();

    // const key: string = "1";

    // const currentValue = await testdb.getSetting("test", "website", key);
    // if (!currentValue) {
    //   // await testdb.updateSetting("test", "website", key, "https://synapt.net/contact.php");
    //   await testdb.updateSetting("test", "website", key, "https://example.com/");
    // }

    // this._logger.important("Stored URL:", await testdb.getSetting("test", "website", key));

    // const screenshot = await testpuppet.getScreenshot();
    // if (screenshot.success) {
    //   this._logger.important("Screenshot saved at:", screenshot.path);
    // } else {
    //   this._logger.error("Screenshot failed:", screenshot.error);
    // }

    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // await testpuppet.updateRuntime({
    //   target_url: "https://synapt.nl/"
    // });
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // await testpuppet.updateRuntime({
    //   target_url: "https://youtube.com/"
    // });

    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // process.exit(0);
    //* END Test code

    // this._puppets.set(testpuppet.getKey(), testpuppet);
  }

  private _syncState(): void {
    // Add init check
    this._logger.debug(`Syncing state to webserver...`);
    this._webServer.setState({
      puppets: this._puppets
        .values()
        .map((puppet) => puppet.getInfo())
        .toArray(),
      system: {
        info: this._info,
        config: this._config,
      },
    });
  }

  private _wireWebServer(): void {
    // TODO: Wire in puppets, or better, an orchestrator to call this._syncState.

    this._webServer.setHandlers({
      puppet: {
        updateRuntime: async (
          id: PuppetKey,
          runtime: Partial<PuppetRuntimeConfigInput>,
        ): Promise<void> => {
          const puppet = this._puppets.get(id);

          if (!puppet) {
            return this._logger.fatal(
              `Puppet does not exist! Tried updating the runtime for puppet with id: ${id}. Requested runtime:`,
              runtime,
            );
          }
          await puppet.updateRuntime(runtime);

          this._logger.important(
            `puppet.updateRuntime() handler called for puppet: ${id} with runtime config:`,
            runtime,
          );
        },
      },
      system: {
        updateConfig: (config: Partial<SystemConfig>): void => {
          const parsed = SystemConfigSchema.parse({
            ...this._config,
            ...config,
          });

          this._config = parsed;
          this._syncState();

          this._logger.important(
            `system.updateConfig() handler called with config:`,
            config,
            `updating the actual config to:`,
            this._config,
          );
        },

        update: {
          check: async (): Promise<void> => {
            this._logger.important(`update.check() handler called.`);
          },
          apply: async (
            ref: string,
            type: "release" | "branch",
          ): Promise<void> => {
            this._logger.important(
              `update.apply() handler called with ref: ${ref} of type: ${type}`,
            );
          },
          getStatus: async (): Promise<void> => {
            this._logger.important(`update.getStatus() handler called.`);
          },
        },
      },
    });
  }
}
