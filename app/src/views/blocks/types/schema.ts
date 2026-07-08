import z from "zod";

const slug = z.string().min(2).max(18).toLowerCase().regex(/^[a-z0-9_-]+$/);

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

export const DataIdSchema = z.object({
  namespace: NamespaceIdSchema,
  field: DataFieldSchema,
});
export type DataId = z.infer<typeof DataIdSchema>;

export const DataKeySchema = z.templateLiteral([NamespaceIdSchema, "::data::", DataFieldSchema]);
export type DataKey = z.infer<typeof DataKeySchema>;

export const DataIdCodec = z.codec(DataKeySchema, DataIdSchema, {
  decode: (key) => {
    const [namespace, , field] = key.split("::");
    return { namespace, field };
  },
  encode: (id) => `${id.namespace}::block::${id.field}` as DataKey,
});

//* Block Config:
export const BaseBlockConfigSchema = z.object({
  id: BlockIdSchema,
}); // TODO: Content more fields in this schema, with styles being a content field? Or keep top level for known fields like content, style, etc?


export function extendBlockConfig<
  const B extends string, // TODO: Should the key extend the BlockKey somehow? Or the BlockId? In any case the format should be enforced.
  T extends z.ZodRawShape,
>(key: B, shape: T) {
  return BaseBlockConfigSchema.extend({
    type: z.literal(key).optional().default(key),
    ...shape,
  });
}

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

//* Block Definitions:
export interface BlockTypeDefinition<TConfig = unknown> {
  key: BlockKey;
  configSchema: z.ZodType<TConfig>;
  component: string;
  fixedDataDependencies?: DataKey[]; // Data sources that are not user configurable
}






//* Some blocks:
// Grid: Auto aranges the blocks in to the best grid for them.
export const GridBlockConfigSchema = extendBlockConfig("webkontrol::grid",{
  blocks: z.array(BaseBlockConfigSchema), // TODO: This should work for all extensions of it, BaseBlockConfig itself should not work as it is not a usable block
});

// ContainerBlock: Allows you to add styling to blocks that do not have it.
export const ContainerBlockConfigSchema = extendBlockConfig("webkontrol::containter",{
  block: BaseBlockConfigSchema, // TODO: This should work for all extensions of it, BaseBlockConfig itself should not work as it is not a usable block
  style: ContainerBlockStyleSchema,
});

// TextBlock: You can do text things!
export const TextBlockConfigSchema = extendBlockConfig("webkontrol::text",{
  text: z.string(),
  style: TextBlockStyleSchema,
});

// FreeFormContainer: Position the blocks wherever you want!
export const FreeFormBlockConfigSchema = extendBlockConfig("webkontrol::freeform",{
  blocks: z.array(z.object({ // TODO: Should theze objects have their own schema?
      block: BaseBlockConfigSchema,
      position: CoordinateSchema,
      size: CoordinateSchema,
    })), // TODO: This should work for all extensions of it, BaseBlockConfig itself should not work as it is not a usable block
});