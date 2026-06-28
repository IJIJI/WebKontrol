import z from "zod";


export const DisplayNameSchema = z.object({
  long: z.string().min(3).max(25),
  short: z.string().max(10).optional(),
})

export type DisplayName = z.infer<typeof DisplayNameSchema>;
export type DisplayNameInput = z.input<typeof DisplayNameSchema>;



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
