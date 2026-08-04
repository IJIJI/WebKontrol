import { type FieldMeta } from "../../../../src/views/types/schema";

// TODO: Distinction between ways to render a field? For example select vs buttonselect?
export type FieldKind = "text" | "url" | "number" | "boolean" | "enum" | "record" | "object" | "unknown"; // TODO Convert to enum

export interface FieldInfo { // TODO: Union for options? Enum is a type and others can be added.
  kind: FieldKind;
  optional: boolean;
  meta: FieldMeta | undefined;
  options: string[]; // enum values; empty otherwise
  defaultValue?: unknown; // schema default, if the field has a .default()
  // The unwrapped core schema (below optional/default/nullable). For `object` fields this is the
  // ZodObject itself, so callers can recurse via objectFields(core).
  core: unknown;
}

// Minimal structural view into the zod internals we introspect. Localizes the unavoidable
// reach into `.def` so the rest of the mapper stays typed. Verified against zod 4.4.3:
// def.type is "string"|"number"|"boolean"|"enum"|"optional"|"default"|"record"; z.url() is a
// string with def.format === "url"; optional/default wrap via def.innerType.
interface ZodLike {
  def: {
    type: string;
    innerType?: ZodLike; // optional/default/nullable wrap
    format?: string; // string sub-format, e.g. "url"
    options?: readonly ZodLike[]; // union members
    values?: readonly unknown[]; // literal values
    entries?: Record<string, string>; // enum value map
    defaultValue?: unknown; // .default() value
    catchall?: unknown; // set on loose objects (z.looseObject); absent on plain z.object
  };
  meta: () => FieldMeta | undefined;
}

const asZod = (schema: unknown): ZodLike => schema as ZodLike;

// Read a field's FieldMeta, unwrap optional/default down to the core type, and classify it
// into a FieldKind the settings registry can render.
export function describeField(schema: unknown): FieldInfo {
  const outer = asZod(schema);
  const meta = outer.meta(); // meta lives on the outermost schema by convention

  let core = outer;
  let optional = false;
  let defaultValue: unknown;
  while (core.def.type === "optional" || core.def.type === "default") {
    if (core.def.type === "optional") optional = true;
    if (core.def.type === "default") defaultValue = core.def.defaultValue;
    if (!core.def.innerType) break; // loop, not a single step: a field can be wrapped twice (e.g. .default().optional())
    core = core.def.innerType;
  }

  const kind = classify(core);
  const options = kind === "enum" ? Object.values(core.def.entries ?? {}) : [];
  return { kind, optional, meta, options, defaultValue, core };
}

function classify(core: ZodLike): FieldKind {
  switch (core.def.type) {
    case "string":
      return core.def.format === "url" ? "url" : "text"; // z.url()/z.email() set def.format; a plain z.string() has none
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "enum":
      return "enum";
    case "record":
      return "record";
    case "object":
      // A loose object (catchall set, e.g. a block slot's AnyBlockConfig) has no closed shape to
      // recurse into — only plain objects are schema-editable.
      return core.def.catchall ? "unknown" : "object";
    case "literal":
      return literalKind(core.def.values); // e.g. z.literal(0)
    case "union":
      // A simple value union like `z.number().or(z.literal(0))` (LoadTimeout): render as the
      // shared kind when every member agrees; give up on genuinely mixed unions.
      return unionKind(core.def.options);
    default:
      return "unknown";
  }
}

function literalKind(values: readonly unknown[] | undefined): FieldKind {
  switch (typeof values?.[0]) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "string":
      return "text";
    default:
      return "unknown";
  }
}

function unionKind(options: readonly ZodLike[] | undefined): FieldKind {
  if (!options?.length) return "unknown";
  const kinds = options.map(classify);
  const [first] = kinds;
  return first !== "unknown" && kinds.every((k) => k === first) ? first : "unknown";
}

// Ordered [key, fieldSchema] pairs of an object schema's shape (insertion order preserved).
export function objectFields(schema: unknown): [string, unknown][] {
  const shape = (schema as { shape?: Record<string, unknown> }).shape ?? {};
  return Object.entries(shape);
}
