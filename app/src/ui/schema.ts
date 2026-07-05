import z from "zod";

export enum UiTheme  {
  AUTO = "auto",
  LIGHT = "light",
  DARK = "dark",
} 

export const UiThemeSchema = z.enum(UiTheme);

// export enum UiBackgroundStyle { // TODO

// }

export const UiRuntimeConfigShape = z.object({
  theme: UiThemeSchema,
  disableBackground: z.boolean(),
});

export const UiRuntimeConfigSchema = UiRuntimeConfigShape.extend({
  theme: UiRuntimeConfigShape.shape.theme.default(UiTheme.AUTO),
  disableBackground: UiRuntimeConfigShape.shape.disableBackground.default(false),
});

export type UiRuntimeConfig = z.infer<typeof UiRuntimeConfigSchema>;
export type UiRuntimeConfigInput = z.input<typeof UiRuntimeConfigSchema>;

