import z from "zod";

export enum UiTheme  {
  AUTO = "auto",
  LIGHT = "light",
  DARK = "dark",
} 

export const UiThemeSchema = z.enum(UiTheme);

// export enum UiBackgroundStyle { // TODO

// }

export const UiRuntimeShape = z.object({
  theme: UiThemeSchema,
  disableBackground: z.boolean(),
});

export const UiRuntimeSchema = UiRuntimeShape.extend({
  theme: UiRuntimeShape.shape.theme.default(UiTheme.AUTO),
  disableBackground: UiRuntimeShape.shape.disableBackground.default(false),
});

export type UiRuntime = z.infer<typeof UiRuntimeSchema>;
export type UiRuntimeInput = z.input<typeof UiRuntimeSchema>;

