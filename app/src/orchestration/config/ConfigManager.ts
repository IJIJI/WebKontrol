import fs from "node:fs";
import path from "node:path";
import { AppConfigSchema, type AppConfig } from "./model";
import YAML from "yaml";
import { Logger } from "../../logging/Logger";

export class ConfigManager {
  private static readonly CONFIG_PATH = path.join(
    process.cwd(),
    `config`,
    `config.yaml`,
  );  

  protected _logger: Logger;
  protected _config!: AppConfig;
  
  constructor() {
    this._logger = new Logger(["LifeCycle","CONFIG","LOADER"]);
  }

  private get _isInit(): boolean {
    return this._config !== undefined;
  }

  public async init(): Promise<void> {
    
    const path = ConfigManager.CONFIG_PATH; // TODO: Env override?
    this._logger.debug("Loading config from config file: ", path);

    try {
      const file = fs.readFileSync(path, 'utf8');
      const data = YAML.parse(file);

      const parsed = AppConfigSchema.parse(data);
      this._config = parsed;
    } catch(error) {
      return this._logger.fatal("Failed loading config from file. Path:", path, "Error", error);
    }
    
    this._logger.info("Loaded config from file:", path, "data:", this._config);
  }

  public getConfig(): AppConfig {
    if (!this._isInit)
      return this._logger.fatal("Tried getting the appconfig, but it has not been loaded yet!");

    return this._config;
  }


}