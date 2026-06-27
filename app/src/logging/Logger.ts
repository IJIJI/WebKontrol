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
  public static readonly PROJECT = "webkontrol"; // TODO: Better way to define this

  public static globalConsoleLevel: LogLevel = LogLevel.IMPORTANT;
  public static globalFileLevel: LogLevel = LogLevel.DEBUG;

  protected static _instanceCount = 0;
  private static readonly INIT_KEY = Symbol.for(
    `${Logger.PROJECT}.logger.initialized`,
  );

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  // /project/logs/webkontrol.log
  private static readonly LOG_DIR = path.join(process.cwd(), "logs");
  private static readonly LOG_FILE = path.join(
    Logger.LOG_DIR,
    `${Logger.PROJECT}.log`,
  );
  private static readonly OLD_LOG_FILE = path.join(
    Logger.LOG_DIR,
    `${Logger.PROJECT}.old.log`,
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

  private _labels: Array<string>;
  private get _prefix(): string {
    return this._labels.join("::");
  }

  constructor(labels: string[]) {
    this._labels = labels;

    if (!fs.existsSync(Logger.LOG_DIR)) {
      fs.mkdirSync(Logger.LOG_DIR, { recursive: true });
    }

    ++Logger._instanceCount;
    if (!(globalThis as Record<symbol, boolean>)[Logger.INIT_KEY]) {
      (globalThis as Record<symbol, boolean>)[Logger.INIT_KEY] = true;
      this._logToFile(
        `\n\n-----===== Logger Initialized at ${new Date().toISOString()} =====-----`,
      );
    }
  }

  getLabels(): Array<string> {
    return this._labels;
  }

  private _print(level: LogLevel, ...data: unknown[]) {
    if (level < Logger.globalFileLevel && level < Logger.globalConsoleLevel)
      return;

    const { label, color } = Logger.LOG_LEVEL_MAP[level];
    const time = new Date().toLocaleTimeString("en-NL");
    const message = this._parseData(data);

    if (level >= Logger.globalConsoleLevel) {
      console.log(
        `${Logger.LOG_GREY_COLOR}${time}${Logger.LOG_RESET_COLOR} [${this._prefix}] ${color}${label}${Logger.LOG_RESET_COLOR}: ${message}`,
      );
    }

    if (level >= Logger.globalFileLevel) {
      this._logToFile(`${time} [${this._prefix}] ${label}: ${message}`);
    }
  }

  // TODO: Use jsonHelper?
  private _parseHelper = (_key: string, value: unknown): unknown => {
    if (value instanceof Error) {
      return { name: value.name, message: value.message, stack: value.stack };
    }
    if (value instanceof Map) {
      return Object.fromEntries(value as Map<PropertyKey, unknown>);
    }
    if (value instanceof Set) {
      return [...value];
    }
    return value;
  };

  private _parseData(data: unknown[]): string {
    return data
      .map((item: unknown) => {
        if (item instanceof Error) return item.stack ?? item.message;

        if (typeof item === "object" && item !== null) {
          try {
            return JSON.stringify(item, this._parseHelper);
          } catch {
            return "[Unserializable Object]";
          }
        }

        return String(item);
      })
      .join(" ");
  }

  private _logToFile(line: string) {
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
    this._print(LogLevel.DEBUG, ...data);
  }
  public info(...data: unknown[]): void {
    this._print(LogLevel.INFO, ...data);
  }
  public important(...data: unknown[]): void {
    this._print(LogLevel.IMPORTANT, ...data);
  }
  public warn(...data: unknown[]): void {
    this._print(LogLevel.WARN, ...data);
  }
  public error(...data: unknown[]): void {
    this._print(LogLevel.ERROR, ...data);
  }

  public fatal(message: string, ...extraData: unknown[]): never {
    this._print(LogLevel.FATAL, message, ...extraData);

    const errorString =
      extraData.length > 0
        ? `${message} | Data: ${JSON.stringify(extraData)}`
        : message;

    throw new Error(`[${this._prefix}] ${errorString}`);
  }
}
