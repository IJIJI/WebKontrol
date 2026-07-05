import path from "node:path";


export class ConfigManager {
  private static readonly CONFIG_PATH = path.join(
    process.cwd(),
    `config`,
    `config.yaml`,
  );  

  
}