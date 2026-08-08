import z from "zod";
// Type-only: views/types/schema imports this file at runtime, so a value import would be a cycle.
import type { FieldMeta } from "../../types/schema";

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
// Takes an optional FieldMeta since zod's `.meta()` replaces rather than merges. A slot wanting
// an editor label must supply it here, in the same bag as the slot marker.
export const BLOCK_SLOT_META = "blockSlot" as const; // TODO: Unify the slot meta and brand value
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- returns an unwieldy zod schema type; inference is clearer.
export const blockSlot = (meta?: FieldMeta) =>
  AnyBlockConfigSchema.meta({ ...meta, [BLOCK_SLOT_META]: true }).brand<"blockSlot">();
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
  x: DimensionSchema.meta({ label: "X" } satisfies FieldMeta), // Coordinate between 0.00 and 100.00, being from one end to the other of the screen.
  y: DimensionSchema.meta({ label: "Y" } satisfies FieldMeta),
});
export type Coordinate = z.infer<typeof CoordinateSchema>;

// A whitespace-separated CSS track list, tokens limited to fr/%/px/auto: covers real display
// layouts while keeping typos and CSS oddities out of the editor. A visual track editor is on
// the backlog.
const gridTrackList = /^\s*(?:\d+(?:\.\d+)?(?:fr|%|px)|auto)(?:\s+(?:\d+(?:\.\d+)?(?:fr|%|px)|auto))*\s*$/;

export const GridConfigSchema = z.object({
  // Capped: every track is a real DOM element, a typo like 200 rows must not build 200 tracks.
  rows: z.number().int().min(1).max(24).meta({ label: "Rows" } satisfies FieldMeta),
  columns: z.number().int().min(1).max(24).meta({ label: "Columns" } satisfies FieldMeta),
  gap: z.number().min(0).max(200).optional().meta({ label: "Gap", description: "Space between cells, in px" } satisfies FieldMeta),
  // A template overrides the count on its axis with explicit track sizes.
  templateRows: z.string().regex(gridTrackList).optional().meta({ label: "Row sizes", description: "Track sizes overriding the row count", placeholder: "1fr 2fr" } satisfies FieldMeta),
  templateColumns: z.string().regex(gridTrackList).optional().meta({ label: "Column sizes", description: "Track sizes overriding the column count", placeholder: "1fr 2fr" } satisfies FieldMeta),
});
export type GridConfig = z.infer<typeof GridConfigSchema>;

//* Block Styling, added as fields in blocks that need them.
/**
 * Tag every field of a shape with an editor `group` (see FieldMeta), merging into whatever meta
 * each field already declares. Grouping belongs to the composition, not to the shape: the same
 * shape reused in another schema is free to be grouped differently, or not at all.
 */
// `z.ZodType`, not `z.ZodRawShape`: the raw-shape type widens to zod's core type, which has no
// `.meta()`. Any shape built from `z.string()` and friends satisfies this.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- returns the shape type it was given; inference is clearer.
export const withGroup = <S extends Record<string, z.ZodType>>(group: string, shape: S) =>
  Object.fromEntries(
    Object.entries(shape).map(([key, field]) => [key, field.meta({ ...field.meta(), group })]),
  ) as S;

export const BackgroundStyleShape = { background: z.string().optional().meta({ label: "Background", description: "CSS background", input: "color" } satisfies FieldMeta) };
export const PaddingStyleShape = {
  padding: z.string().optional().meta({ label: "Padding", description: "CSS padding", input: "box" } satisfies FieldMeta),
  // Safe because it sits on the box *inside* the slot: it insets the block from its own slot
  // and can never push a sibling. Gap stays the tool for spacing blocks apart.
  margin: z.string().optional().meta({ label: "Margin", description: "CSS margin, insets the block inside its own space", input: "box" } satisfies FieldMeta),
};
export const BorderStyleShape = {
  border: z.string().optional().meta({ label: "Border", description: "CSS border" } satisfies FieldMeta),
  borderRadius: z.string().optional().meta({ label: "Corner radius", description: "CSS border-radius", input: "corners" } satisfies FieldMeta),
};
export const EffectsStyleShape = {
  // Placeholder doubles as the slider's resting position while unset: leaving this empty renders
  // fully opaque, so the thumb belongs at 1, not at the 0 end.
  opacity: z.number().min(0).max(1).optional().meta({ label: "Opacity", description: "0 (invisible) to 1", placeholder: "1", input: "range" } satisfies FieldMeta),
  boxShadow: z.string().optional().meta({ label: "Shadow", description: "CSS box-shadow" } satisfies FieldMeta),
  // No schema default: the stylesheet's `.wk-block { overflow: hidden }` is the default, and a
  // value set here overrides it inline. So unset is not the same as picking `hidden`, even
  // though they render alike today: unset keeps following the stylesheet (and so any user CSS
  // layered over it), while `hidden` pins this block against a change to either.
  overflow: z.enum(["visible", "hidden"]).optional().meta({
    label: "Overflow",
    description: "Unset follows the view stylesheet, which clips",
    input: "buttons",
    optionLabels: { "": "Default" },
  } satisfies FieldMeta),
};
// All optional, deliberately: these are CSS-inheriting properties, so an unset field emits
// nothing inline and the value cascades from the nearest ancestor block that set it (the
// page default lives in view.css). Setting a font on a stack styles every text child.
export const FontStyleShape = {
  fontFamily: z.string().optional().meta({ label: "Font family", description: "Unset inherits from the parent block", input: "font" } satisfies FieldMeta),
  fontSize: z.number().min(8).max(500).optional().meta({ label: "Font size", description: "In px. Unset inherits from the parent block" } satisfies FieldMeta),
  // Numeric values rather than the `normal`/`bold` keywords: they stay correct for a variable
  // font with real weight steps, while the labels keep the list readable. Most web-safe fonts
  // only render 400 and 700 whatever is picked, hence the names rather than nine bare numbers.
  fontWeight: z.enum(["100", "200", "300", "400", "500", "600", "700", "800", "900"]).optional().meta({
    label: "Weight",
    optionLabels: {
      "": "Inherit", // font-weight inherits: unset takes the parent's weight, which is not 400
      "100": "100 Thin", "200": "200 Extra light", "300": "300 Light",
      "400": "400 Normal", "500": "500 Medium", "600": "600 Semibold",
      "700": "700 Bold", "800": "800 Extra bold", "900": "900 Black",
    },
  } satisfies FieldMeta),
  color: z.string().optional().meta({ label: "Text color", description: "CSS color. Unset inherits from the parent block", input: "color" } satisfies FieldMeta),
  lineHeight: z.number().min(0.5).max(3).optional().meta({ label: "Line height", description: "Multiplier of the font size. Unset inherits", input: "range" } satisfies FieldMeta),
  letterSpacing: z.number().min(-10).max(50).optional().meta({ label: "Letter spacing", description: "In px. Unset inherits" } satisfies FieldMeta),
  textTransform: z.enum(["uppercase", "lowercase", "capitalize"]).optional().meta({
    label: "Transform",
    optionLabels: { "": "Inherit", uppercase: "UPPER", lowercase: "lower", capitalize: "Capitalise" },
  } satisfies FieldMeta),
  fontStyle: z.enum(["normal", "italic"]).optional().meta({
    label: "Italic",
    input: "buttons",
    optionLabels: { "": "Inherit", normal: "Normal", italic: "Italic" },
  } satisfies FieldMeta),
  // A separate CSS property from font-style, and one that does *not* inherit, so unset means
  // none rather than "take the parent's". No explicit `none` option for that same reason: it
  // would only duplicate unset, and CSS gives a descendant no way to cancel a decoration an
  // ancestor drew anyway. One line at a time, as in every other builder; the shorthand's wavy
  // and coloured forms stay out of reach here by design.
  textDecoration: z.enum(["underline", "line-through", "overline"]).optional().meta({
    label: "Decoration",
    optionLabels: { "": "None", underline: "Underline", "line-through": "Strikethrough", overline: "Overline" },
  } satisfies FieldMeta),
  wordSpacing: z.number().min(-20).max(100).optional().meta({ label: "Word spacing", description: "In px. Unset inherits" } satisfies FieldMeta),
  textShadow: z.string().optional().meta({ label: "Text shadow", description: "CSS text-shadow, e.g. 0 2px 6px black. Unset inherits" } satisfies FieldMeta),
};

// A reusable position pair (chip placement, freeform item anchors, future pickers). The factory
// lets use sites pick their own defaults (a chip centers, a freeform item anchors top-left).
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- returns an unwieldy zod schema type; inference is clearer.
export const alignmentSchema = (horizontal: "left" | "center" | "right", vertical: "top" | "middle" | "bottom") =>
  z.object({
    horizontal: z.enum(["left", "center", "right"]).default(horizontal).meta({ label: "Horizontal", input: "buttons" } satisfies FieldMeta),
    vertical: z.enum(["top", "middle", "bottom"]).default(vertical).meta({ label: "Vertical", input: "buttons" } satisfies FieldMeta),
  }).prefault({});
export const AlignmentSchema = alignmentSchema("center", "middle");
export type Alignment = z.infer<typeof AlignmentSchema>;

//* The universal block box style:
// Every block gets this via defineBlock's injection (the framework owns the box). Box fields
// style the block's own box; font fields cascade to descendants (see FontStyleShape). The
// shape is exported for composition; `blockStyleSchema` builds the per-block schema.
// Grouped for the editor here, at the composition, since every block carries this whole set:
// the box half folds under "Box", the inheriting text half under "Text".
export const BlockStyleShape = {
  ...withGroup("Box", {
    ...BackgroundStyleShape,
    ...PaddingStyleShape,
    ...BorderStyleShape,
    ...EffectsStyleShape,
  }),
  ...withGroup("Text", FontStyleShape),
};

// Hug-capable blocks additionally get sizing + alignment. `content` hugs the content, so
// background/padding/border form a chip the alignment places inside the block; `container`
// stretches it over the whole block. One alignment drives placement AND text-align, so there
// are never two competing horizontal alignments. Fill-only blocks (website, grid, …) never
// get these fields: content sizing would collapse them to nothing.
const sizingFields = (defaultSizing: "container" | "content") => ({
  sizing: z.enum(["container", "content"]).default(defaultSizing).meta({ label: "Sizing", description: "Hug the content, or fill the block", input: "buttons" } satisfies FieldMeta),
  alignment: AlignmentSchema.meta({ label: "Alignment", input: "alignment" } satisfies FieldMeta),
});

/** The injected `style` schema for one block: the universal box, plus sizing/alignment when hug-capable. */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- returns an unwieldy zod schema type; inference is clearer.
export const blockStyleSchema = (sizing?: "container" | "content") =>
  z.object({
    ...BlockStyleShape,
    ...(sizing ? sizingFields(sizing) : {}),
  }).prefault({}).meta({ label: "Style", collapsed: true } satisfies FieldMeta);

// One type for every block's style: sizing/alignment are optional at the type level (fill-only
// blocks don't have them); a hug-capable block's parse always fills them.
export type BlockStyle = z.infer<ReturnType<typeof blockStyleSchema>> & {
  sizing?: "container" | "content";
  alignment?: Alignment;
};


