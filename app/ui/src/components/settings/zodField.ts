import { type FieldMeta } from "../../../../src/views/types/schema";

// TODO: Distinction between ways to render a field? For example select vs buttonselect?
export type FieldKind = "text" | "url" | "number" | "boolean" | "enum" | "record" | "object" | "array" | "unknown"; // TODO Convert to enum

export interface FieldInfo { // TODO: Union for options? Enum is a type and others can be added.
  kind: FieldKind;
  optional: boolean;
  meta: FieldMeta | undefined;
  options: string[]; // enum values; empty otherwise
  defaultValue?: unknown; // schema default, if the field has a .default()
  // The unwrapped core schema (below optional/default/nullable). For `object` fields this is the
  // ZodObject itself, so callers can recurse via objectFields(core).
  core: unknown;
  // Kind-specific constraints, flat like `options` above. Numbers only, for now.
  // TODO: if a third kind needs its own constraints, make FieldInfo a discriminated union on
  // `kind` (renderField already switches on it, so narrowing comes free) and fold `options` in.
  min?: number;
  max?: number;
  step?: number;
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
    checks?: readonly unknown[]; // refinements: .int(), .multipleOf(), .min()/.max(), …
  };
  meta: () => FieldMeta | undefined;
}

// One entry of `def.checks`, reached via `_zod.def` (or `def` on older shapes).
interface CheckDef {
  check?: string; // e.g. "multiple_of", "number_format", "greater_than"
  value?: unknown;
  format?: string; // for number_format: "safeint", "int", …
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
  const DEFAULTING = ["default", "prefault"]; // both fill an omitted value with def.defaultValue
  while (["optional", "nullable", ...DEFAULTING].includes(core.def.type)) {
    if (DEFAULTING.includes(core.def.type)) defaultValue = core.def.defaultValue;
    else optional = true; // optional and nullable both mean "may be absent" to the UI
    if (!core.def.innerType) break; // loop, not a single step: a field can be wrapped twice (e.g. .default().optional())
    core = core.def.innerType;
  }

  const kind = classify(core);
  const options = kind === "enum" ? Object.values(core.def.entries ?? {}) : [];
  const bounds = kind === "number" ? numberBounds(core) : {};
  return { kind, optional, meta, options, defaultValue, core, ...bounds };
}

// A number schema's input constraints: min/max from zod's getters (dropping unbounded sides,
// which zod reports as null or ±MAX_SAFE_INTEGER — neither belongs on an <input>), and step from
// its checks, so an integer field steps by 1 instead of the browser's default 1-with-decimals.
function numberBounds(core: ZodLike): { min?: number; max?: number; step?: number } {
  const { minValue, maxValue } = core as unknown as {
    minValue?: number | null;
    maxValue?: number | null;
  };
  const finite = (v: number | null | undefined): number | undefined =>
    typeof v === "number" && Math.abs(v) < Number.MAX_SAFE_INTEGER ? v : undefined;

  return { min: finite(minValue), max: finite(maxValue), step: numberStep(core) };
}

// Zod keeps `.int()` and `.multipleOf()` as checks rather than getters; both map to input step.
function numberStep(core: ZodLike): number | undefined {
  let step: number | undefined;
  for (const check of core.def.checks ?? []) {
    const def = (check as { _zod?: { def?: CheckDef }; def?: CheckDef })._zod?.def ?? (check as { def?: CheckDef }).def;
    if (!def) continue;
    if (def.check === "multiple_of" && typeof def.value === "number") step = def.value;
    // Any integer format (int / safeint / …) means whole numbers only.
    if (def.check === "number_format" && typeof def.format === "string" && def.format.includes("int")) {
      step ??= 1;
    }
  }
  return step;
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
    case "array":
      return "array";
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
