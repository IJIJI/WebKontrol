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

/** The block key for a specific namespace + type, e.g. `webkontrol::block::text`. */
export type BlockKeyOf<N extends NamespaceId, T extends BlockType> = `${N}::block::${T}`;

export const BlockIdCodec = z.codec(BlockKeySchema, BlockIdSchema, {
  decode: (key) => {
    const [namespace, , type] = key.split("::");
    return { namespace, type };
  },
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- id parts are typed `string`, so the template literal widens to string; the cast is required.
  encode: (id) => `${id.namespace}::block::${id.type}` as BlockKey,
});

export const DataFieldSchema = slug;
export type DataField = z.infer<typeof DataFieldSchema>;

export const DataSourceSchema = z.object({
  namespace: NamespaceIdSchema,
  field: DataFieldSchema,
});
export type DataSource = z.infer<typeof DataSourceSchema>;

export const DataSourceKeySchema = z.templateLiteral([NamespaceIdSchema, "::data::", DataFieldSchema]);
export type DataSourceKey = z.infer<typeof DataSourceKeySchema>;

/** The data source key for a specific namespace + field, e.g. `webkontrol::data::time`. */
export type DataKeyOf<N extends NamespaceId, F extends DataField> = `${N}::data::${F}`;

export const DataIdCodec = z.codec(DataSourceKeySchema, DataSourceSchema, {
  decode: (key) => {
    const [namespace, , field] = key.split("::");
    return { namespace, field };
  },
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- id parts are typed `string`, so the template literal widens to string; the cast is required.
  encode: (id) => `${id.namespace}::data::${id.field}` as DataSourceKey,
});

//* Block Definitions:
// Every block has a type, loose to ignore the rest of the values.
export const AnyBlockConfigSchema = z.looseObject({ type: BlockKeySchema });
export type AnyBlockConfig = z.infer<typeof AnyBlockConfigSchema>;

// A child-block slot. Marked by both meta and brand. Meta is used while walking the schema, brand is used at compile time to resolve blocks to Resolved<T>.
export const BLOCK_SLOT_META = "blockSlot" as const; // TODO: Unify the slot meta and brand value
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- returns an unwieldy zod schema type; inference is clearer.
export const blockSlot = () =>
  AnyBlockConfigSchema.meta({ [BLOCK_SLOT_META]: true }).brand<"blockSlot">();
export type BlockSlot = z.infer<ReturnType<typeof blockSlot>>;

export function isBlockSlot(schema: z.ZodType): boolean {
  return schema.meta()?.[BLOCK_SLOT_META] === true;
}

//* Data binding:
// Can be a literal or a DataSource, which is updated as it changes. 
// Values that can be either use bindabl()
// TODO: Enforce binding types via a namespaced DataType key (identity match with
// DataSources) + schema validation at runtime. Probably enable {namespace}::type::{type} = schema?
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- returns an unwieldy zod schema type; inference is clearer.
export const bindable = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("literal"), value }),
    z.object({ kind: z.literal("binding"), source: DataSourceKeySchema }),
  ]);

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


