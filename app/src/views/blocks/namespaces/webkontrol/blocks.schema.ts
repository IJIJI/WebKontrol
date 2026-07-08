import z from "zod";
import { AnyBlockConfigSchema, ContainerBlockStyleSchema, CoordinateSchema, TextBlockStyleSchema, type BlockTypeDefinition } from "../../types/schema";

// WebsiteBlock: You can display websites!
export const WebsiteBlockTypeSchema: BlockTypeDefinition = {
  key: "webkontrol::block::website",
  configSchema: z.object({
    url: z.url(),
  }),
  fixedDataDependencies: [],
};

// TextBlock: You can do text things!
export const TextBlockTypeSchema: BlockTypeDefinition = {
  key: "webkontrol::block::text",
  configSchema: z.object({
    text: z.string(),
    style: TextBlockStyleSchema,
  }),
  fixedDataDependencies: [],
};

// ContainerBlock: Allows you to add styling to blocks that do not have it.
export const ContainerBlockTypeSchema: BlockTypeDefinition = {
  key: "webkontrol::block::containter",
  configSchema: z.object({
    block: AnyBlockConfigSchema,
    style: ContainerBlockStyleSchema,
  }),
  fixedDataDependencies: [],
};

// Grid: Auto aranges the blocks in to the best grid for them.
export const GridBlockTypeSchema: BlockTypeDefinition = {
  key: "webkontrol::block::grid",
  configSchema: z.object({
    blocks: z.array(AnyBlockConfigSchema),
  }),
  fixedDataDependencies: [],
};

// FreeFormContainer: Position the blocks wherever you want!
export const FreeFormBlockTypeSchema: BlockTypeDefinition = {
  key: "webkontrol::block::freeform",
  configSchema: z.object({
  blocks: z.array(
    z.object({ // TODO: Should theze objects have their own schema?
      block: AnyBlockConfigSchema,
      position: CoordinateSchema,
      size: CoordinateSchema,
    })), 
  }),
  fixedDataDependencies: [],
};

// TextBlock: You can do text things!
export const DateTimeBlockTypeSchema: BlockTypeDefinition = {
  key: "webkontrol::block::text",
  configSchema: z.object({
    format: z.string().regex(/^(?:[dDjlNSwzWFmMntLoYyaABgGhHisuveIOPpTZcrU]|\\.|[\s\-\/\:\.,\|])+$/).optional().default("H:i:s"),
    style: TextBlockStyleSchema,
  }),
  fixedDataDependencies: [],
};