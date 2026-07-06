import z from "zod";

export const DisplayNameSchema = z.object({
  long: z.string().min(3).max(25),
  short: z.string().min(1).max(10),
});

export type DisplayName = z.infer<typeof DisplayNameSchema>;
export type DisplayNameInput = z.input<typeof DisplayNameSchema>;

export const DisplayNameOptionalSchema = DisplayNameSchema.extend({
  short: DisplayNameSchema.shape.short.optional(),
});
export type DisplayNameOptional = z.infer<typeof DisplayNameOptionalSchema>;
export type DisplayNameOptionalInput = z.input<typeof DisplayNameOptionalSchema>;

export enum ConnectionState {
  DISABLED = "Disabled",
  OFFLINE = "Offline",
  ONLINE = "Online",
  ERROR = "Error",
  FAILED = "Failed",
  UNKNOWN = "Unknown",
}

export const ConnectionStateSchema = z.enum(ConnectionState);

export const ConnectionStateInputSchema = ConnectionStateSchema.default(
  ConnectionState.UNKNOWN,
);
export type ConnectionStateInput = z.input<typeof ConnectionStateInputSchema>;

export type WithRequired<T, K extends keyof T> = Partial<T> &
  Required<Pick<T, K>>;

export type WithRequiredExept<T, K extends keyof T> = Partial<T> &
  Required<Omit<T, K>>;

export abstract class CommonTools {
  static areDisplayNamesEqual(a: DisplayName, b: DisplayName): boolean {
    return a.long === b.long && a.short === b.short;
  }
}
