import { type BlockLike, isBlock } from "./blockUtils";

function isScalar(v: unknown): boolean {
  return (
    v === null ||
    v === undefined ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  );
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function scalarText(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v === null) return "null";
  return "—";
}

// A small all-number object (e.g. a coordinate `{x, y}`) rendered compactly as "5, 5".
// TODO: per-field summary formats (e.g. size as "40×20") once the pane can read the schema.
function coordinateText(v: Record<string, unknown>): string | null {
  const values = Object.values(v);
  if (values.length === 0 || values.length > 3) return null;
  if (!values.every((x) => typeof x === "number")) return null;
  return values.join(", ");
}

// The rendering shape of a config value — the single place that decides "what kind is this". Inline
// kinds sit on a field row; `object`/`array` expand into a collapsible group.
export type ConfigValue =
  | { kind: "scalar"; text: string }
  | { kind: "coordinate"; text: string }
  | { kind: "block"; block: BlockLike }
  | { kind: "scalarArray"; text: string }
  | { kind: "emptyArray" }
  | { kind: "emptyObject" }
  | { kind: "array"; items: readonly unknown[] }
  | { kind: "object"; entries: [string, unknown][] };

export function classify(value: unknown): ConfigValue {
  if (isBlock(value)) return { kind: "block", block: value };
  if (isScalar(value)) return { kind: "scalar", text: scalarText(value) };
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "emptyArray" };
    if (value.every(isScalar)) return { kind: "scalarArray", text: value.map(scalarText).join(", ") };
    return { kind: "array", items: value };
  }
  if (isPlainObject(value)) {
    if (Object.keys(value).length === 0) return { kind: "emptyObject" };
    const coord = coordinateText(value);
    if (coord !== null) return { kind: "coordinate", text: coord };
    return { kind: "object", entries: Object.entries(value) };
  }
  return { kind: "scalar", text: scalarText(value) };
}

// A single value compacted to one token for a collapsed wrapper's summary.
export function summaryToken(value: unknown): string {
  const c = classify(value);
  switch (c.kind) {
    case "scalar":
    case "coordinate":
    case "scalarArray":
      return c.text;
    case "emptyArray":
      return "[ ]";
    case "emptyObject":
      return "{ }";
    case "block":
    case "array":
    case "object":
      return "…";
  }
}
