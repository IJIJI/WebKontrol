import z from "zod";

const slug = z.string().min(2).max(18).toLowerCase().regex(/^[a-z][a-z0-9_-]*$/);

export const NamespaceIdSchema = slug;
export type NamespaceId = z.infer<typeof NamespaceIdSchema>;

export const BlockTypeSchema = slug;
export type BlockType = z.infer<typeof BlockTypeSchema>;

export const BlockIdSchema = z.object({
  namespace: NamespaceIdSchema,
  type: BlockTypeSchema,
});

export type BlockId = z.infer<typeof BlockIdSchema>;

export const BlockKeySchema = z.templateLiteral([NamespaceIdSchema, "::block::", BlockTypeSchema]);
export type BlockKey = z.infer<typeof BlockKeySchema>;

export const BlockIdCodec = z.codec(BlockKeySchema, BlockIdSchema, {
  decode: (key) => {
    const [namespace, , type] = key.split("::");
    return { namespace, type };
  },
  encode: (id) => `${id.namespace}::block::${id.type}` as BlockKey,
});

export const DataFieldSchema = slug;
export type DataField = z.infer<typeof DataFieldSchema>;

export const DataProviderSchema = z.object({
  namespace: NamespaceIdSchema,
  field: DataFieldSchema,
});
export type DataProvider = z.infer<typeof DataProviderSchema>;

export const DataKeySchema = z.templateLiteral([NamespaceIdSchema, "::data::", DataFieldSchema]);
export type DataKey = z.infer<typeof DataKeySchema>;

export const DataIdCodec = z.codec(DataKeySchema, DataProviderSchema, {
  decode: (key) => {
    const [namespace, , field] = key.split("::");
    return { namespace, field };
  },
  encode: (id) => `${id.namespace}::block::${id.field}` as DataKey,
});

//* Block Definitions:
export interface BlockTypeDefinition<TConfig = unknown> {
  key: BlockKey;
  configSchema: z.ZodType<TConfig>;
  fixedDataDependencies?: DataKey[]; // Data sources that are not user configurable
}

export const AnyBlockConfigSchema = z.looseObject({ type: BlockKeySchema });

//* Data Types:
export const DimensionSchema = z.number().min(0).max(100);
export type Dimension = z.infer<typeof DimensionSchema>;

export const CoordinateSchema = z.object({
  x: DimensionSchema, // Coordinate between 0.00 and 100.00, being from one end to the other of the screen.
  y: DimensionSchema,
});
export type Coordinate = z.infer<typeof CoordinateSchema>;

//* Block Styling, added as fields in blocks that need them.
export const BackgroundStyleShape = { background: z.string().optional() };
export const PaddingStyleShape = { padding: z.string().optional() }; // TODO: Add top right bottom left?
export const BorderStyleShape = { border: z.string().optional() }; // TODO: Add border radius?
export const FontStyleShape = {
  fontFamily: z.string().optional(),
  fontSize: z.number().min(8).max(500).default(48),
  align: z.enum(["left", "center", "right"]).default("center"),
};

//* Block Styling combination sets:
export const ContainerBlockStyleSchema = z.object({ //* Prettymuch all blocks are containers, except things like a website or a grid.
  ...BackgroundStyleShape,
  ...PaddingStyleShape,
  ...BorderStyleShape,
});
export type ContainerBlockStyle = z.infer<typeof ContainerBlockStyleSchema>;

export const TextBlockStyleSchema = ContainerBlockStyleSchema.extend({
  ...FontStyleShape,
});








//* Some blocks:
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