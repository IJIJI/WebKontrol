export interface DisplayName {
  long: string;
  short?: string;
}

export enum ConnectionState {
  DISABLED = "Disabled",
  OFFLINE = "Offline",
  ONLINE = "Online",
  ERROR = "Error",
  FAILED = "Failed",
}

export type WithRequired<T, K extends keyof T> = Partial<T> &
  Required<Pick<T, K>>;

export abstract class CommonTools {
  static areDisplayNamesEqual(a: DisplayName, b: DisplayName): boolean {
    return a.long === b.long && a.short === b.short;
  }
}
