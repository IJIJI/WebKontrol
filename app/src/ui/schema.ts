import z from "zod";

export enum UiTheme  {
  AUTO = "auto",
  LIGHT = "light",
  DARK = "dark",
} 

export const UiThemeSchema = z.enum(UiTheme);

// export enum UiBackgroundStyle { // TODO

// }

export const UiRuntimeConfigSchema = z.object({
  theme: UiThemeSchema.default(UiTheme.AUTO),
  disableBackground: z.boolean().default(false),
});

export type UiRuntimeConfig = z.infer<typeof UiRuntimeConfigSchema>;
export type UiRuntimeConfigInput = z.input<typeof UiRuntimeConfigSchema>;

