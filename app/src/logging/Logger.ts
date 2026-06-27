import * as fs from "node:fs";
import * as path from "node:path";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  IMPORTANT = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

interface LogConfig {
  label: string;
  color: string;
}

export class Logger {
  public static readonly project = "webkontrol";

  public static GlobalConsoleLevel: LogLevel = LogLevel.IMPORTANT;
  public static GlobalFileLevel: LogLevel = LogLevel.DEBUG;

  protected static instanceCount = 0;
  private static readonly INIT_KEY = Symbol.for(
    `${Logger.project}.logger.initialized`,
  );

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  // /project/logs/webkontrol.log
  private static readonly LOG_DIR = path.join(process.cwd(), "logs");
  private static readonly LOG_FILE = path.join(
    Logger.LOG_DIR,
    `${Logger.project}.log`,
  );
  private static readonly OLD_LOG_FILE = path.join(
    Logger.LOG_DIR,
    `${Logger.project}.old.log`,
  );

  private static readonly LOG_LEVEL_MAP: Record<LogLevel, LogConfig> = {
    [LogLevel.DEBUG]: { label: "DEBUG", color: "\x1b[90m" }, // Gray
    [LogLevel.INFO]: { label: "INFO ", color: "\x1b[36m" }, // Cyan
    [LogLevel.IMPORTANT]: { label: "IMPORTANT", color: "\x1b[34m" }, // Blue
    [LogLevel.WARN]: { label: "WARN ", color: "\x1b[33m" }, // Yellow
    [LogLevel.ERROR]: { label: "ERROR", color: "\x1b[31m" }, // Red
    [LogLevel.FATAL]: { label: "FATAL", color: "\x1b[35m" }, // Magenta
  };
  private static readonly LOG_RESET_COLOR = "\x1b[0m";
  private static readonly LOG_GREY_COLOR = "\x1b[90m";

  private prefix: string;

  constructor(prefix: string[]) {
    this.prefix = prefix.join("::");

    if (!fs.existsSync(Logger.LOG_DIR)) {
      fs.mkdirSync(Logger.LOG_DIR, { recursive: true });
    }

    ++Logger.instanceCount;
    if (!(globalThis as Record<symbol, boolean>)[Logger.INIT_KEY]) {
      (globalThis as Record<symbol, boolean>)[Logger.INIT_KEY] = true;
      this.logToFile(
        `\n\n-----===== Logger Initialized at ${new Date().toISOString()} =====-----`,
      );
    }
  }

  private print(level: LogLevel, ...data: unknown[]) {
    if (level < Logger.GlobalFileLevel && level < Logger.GlobalConsoleLevel)
      return;

    const { label, color } = Logger.LOG_LEVEL_MAP[level];
    const time = new Date().toLocaleTimeString("en-NL");
    const message = this.parseData(data);

    if (level >= Logger.GlobalConsoleLevel) {
      console.log(
        `${Logger.LOG_GREY_COLOR}${time}${Logger.LOG_RESET_COLOR} [${this.prefix}] ${color}${label}${Logger.LOG_RESET_COLOR}: ${message}`,
      );
    }

    if (level >= Logger.GlobalFileLevel) {
      this.logToFile(`${time} [${this.prefix}] ${label}: ${message}`);
    }
  }

  private parseData(data: unknown[]): string {
    return data
      .map((item: unknown) => {
        if (item instanceof Error) return item.stack || item.message;

        if (typeof item === "object" && item !== null) {
          return JSON.stringify(item, (key, value) => {
            // Check if the current value being stringified is a Map
            if (
              value instanceof Map ||
              (value && value.constructor && value.constructor.name === "Map")
            ) {
              return Object.fromEntries(value);
            }
            return value;
          });
        }

        return String(item);
      })
      .join(" ");
  }

  private logToFile(line: string) {
    try {
      // Check size and overwrite if too big
      if (fs.existsSync(Logger.LOG_FILE)) {
        const stats = fs.statSync(Logger.LOG_FILE);

        if (stats.size > Logger.MAX_FILE_SIZE) {
          if (fs.existsSync(Logger.OLD_LOG_FILE))
            fs.unlinkSync(Logger.OLD_LOG_FILE);
          fs.renameSync(Logger.LOG_FILE, Logger.OLD_LOG_FILE);
          fs.writeFileSync(
            Logger.LOG_FILE,
            `--- Log Rotated at ${new Date().toISOString()} ---\n`,
          );
        }
      }
      fs.appendFileSync(Logger.LOG_FILE, line + "\n");
    } catch (err) {
      const { label, color } = Logger.LOG_LEVEL_MAP[LogLevel.ERROR];
      const time = new Date().toLocaleTimeString("en-NL");
      console.log(
        `${color}${time} [LOGGER] ${label}: Logger failed to write to disk${Logger.LOG_RESET_COLOR}`,
        err,
      );
    }
  }

  public debug(...data: unknown[]): void {
    this.print(LogLevel.DEBUG, ...data);
  }
  public info(...data: unknown[]): void {
    this.print(LogLevel.INFO, ...data);
  }
  public important(...data: unknown[]): void {
    this.print(LogLevel.IMPORTANT, ...data);
  }
  public warn(...data: unknown[]): void {
    this.print(LogLevel.WARN, ...data);
  }
  public error(...data: unknown[]): void {
    this.print(LogLevel.ERROR, ...data);
  }

  public fatal(message: string, ...extraData: unknown[]): never {
    this.print(LogLevel.FATAL, message, ...extraData);

    const errorString =
      extraData.length > 0
        ? `${message} | Data: ${JSON.stringify(extraData)}`
        : message;

    throw new Error(`[${this.prefix}] ${errorString}`);
  }
}
