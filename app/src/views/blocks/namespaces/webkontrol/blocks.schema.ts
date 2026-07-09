import z from "zod";
import { AnyBlockConfigSchema, ContainerBlockStyleSchema, CoordinateSchema, TextBlockStyleSchema } from "../../types/schema";
import { AbstractBlockType } from "../../types/model";

// WebsiteBlock: You can display websites!
export const WebsiteBlockConfigSchema = z.object({
  url: z.url(),
});
export type WebsiteBlockConfig = z.infer<typeof WebsiteBlockConfigSchema>;
export class WebsiteBlockType extends AbstractBlockType<WebsiteBlockConfig> {
  readonly key = "webkontrol::block::website" as const; // TODO: Const needed?
  readonly configSchema = WebsiteBlockConfigSchema;
};

// TextBlock: You can do text things!
export const TextBlockConfigSchema = z.object({
  text: z.string(),
  style: TextBlockStyleSchema,
});
export type TextBlockConfig = z.infer<typeof TextBlockConfigSchema>;
export class TextBlockType extends AbstractBlockType<TextBlockConfig> {
  readonly key = "webkontrol::block::text" as const; // TODO: Const needed?
  readonly configSchema = TextBlockConfigSchema;
};

// ContainerBlock: Allows you to add styling to blocks that do not have it.
export const ContainerBlockConfigSchema = z.object({
  block: AnyBlockConfigSchema,
  style: ContainerBlockStyleSchema,
});
export type ContainerBlockConfig = z.infer<typeof ContainerBlockConfigSchema>;
export class ContainerBlockType extends AbstractBlockType<ContainerBlockConfig> {
  readonly key = "webkontrol::block::container" as const; // TODO: Const needed?
  readonly configSchema = ContainerBlockConfigSchema;
}

// Grid: Auto aranges the blocks in to the best grid for them.
export const GridBlockConfigSchema = z.object({
  blocks: z.array(AnyBlockConfigSchema),
});
export type GridBlockConfig = z.infer<typeof GridBlockConfigSchema>;
export class GridBlockType extends AbstractBlockType<GridBlockConfig> {
  readonly key = "webkontrol::block::grid" as const; // TODO: Const needed?
  readonly configSchema = GridBlockConfigSchema;
}

// FreeFormContainer: Position the blocks wherever you want!
export const FreeFormBlockConfigSchema = z.array(
  z.object({ // TODO: Should theze objects have their own schema?
    block: AnyBlockConfigSchema,
    position: CoordinateSchema,
    size: CoordinateSchema,
}));
export type FreeFormBlockConfig = z.infer<typeof FreeFormBlockConfigSchema>;
export class FreeFormBlockType extends AbstractBlockType<FreeFormBlockConfig> {
  readonly key = "webkontrol::block::freeform" as const; // TODO: Const needed?
  readonly configSchema = FreeFormBlockConfigSchema;
}

// TextBlock: You can do text things!
export const DateTimeBlockConfigSchema = z.object({
  format: z.string().regex(/^(?:[dDjlNSwzWFmMntLoYyaABgGhHisuveIOPpTZcrU]|\\.|[\s\-\/\:\.,\|])+$/).optional().default("H:i:s"),
  style: TextBlockStyleSchema,
});
export type DateTimeBlockConfig = z.infer<typeof DateTimeBlockConfigSchema>;
export class DateTimeBlockType extends AbstractBlockType<DateTimeBlockConfig> {
  readonly key = "webkontrol::block::datetime" as const; // TODO: Const needed?
  readonly configSchema = DateTimeBlockConfigSchema;
}