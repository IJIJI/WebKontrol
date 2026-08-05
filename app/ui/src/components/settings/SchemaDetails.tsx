import { useState, type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./schemaDetails.less";

// Shared open/close state for the detail view's collapsibles.
export function useDisclosure(defaultOpen = false): { open: boolean; toggle: () => void } {
  const [open, setOpen] = useState(defaultOpen);
  return { open, toggle: () => setOpen((o) => !o) };
}

// The disclosure caret shared by every collapsible head.
// TODO: Animate?
export function Caret({ open }: { open: boolean }): JSX.Element {
  return (
    <span className="caret" aria-hidden="true">
      {open ? "▾" : "▸"}
    </span>
  );
}

/** One inspected field: its label on the left, its value on the right. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="fieldRow">
      <span className="fieldKey">{label}</span>
      <span className="fieldVal">{children}</span>
    </div>
  );
}

/**
 * A collapsible sub-section of an inspected object (a nested object, or an array's items). The
 * count summarises what is hidden, so it only shows while closed. Array bodies are `flat`: their
 * items sit at the array's own level rather than indented, since they carry no field name.
 */
export function DetailGroup({
  label,
  count,
  flat = false,
  defaultOpen = false,
  children,
}: {
  label: string;
  count?: string;
  flat?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}): JSX.Element {
  const { open, toggle } = useDisclosure(defaultOpen);
  return (
    <div className="group">
      <button type="button" className="groupHead" onClick={toggle} aria-expanded={open}>
        <span className="fieldKey">{label}</span>
        <Caret open={open} />
        {!open && count !== undefined && <span className="groupCount">{count}</span>}
      </button>
      {open && <div className={flat ? "groupBody flat" : "groupBody"}>{children}</div>}
    </div>
  );
}

/** Plural-aware count for a group head, e.g. "3 items" / "1 field". */
export function countLabel(n: number, unit: "item" | "field"): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function scalarText(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v === null) return "null";
  return "—";
}

const isScalar = (v: unknown): boolean => typeof v !== "object" || v === null;

/**
 * A value as one row of inspection text: scalars raw, small all-number objects (coordinates)
 * as "5, 5", empty containers as their bracket pair, everything else summarised per entry.
 */
export function displayValue(value: unknown): string {
  if (value === undefined || value === "") return "—";
  if (isScalar(value)) return scalarText(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? "[ ]" : value.map(summaryToken).join(", ");
  }
  const values = Object.values(value as Record<string, unknown>);
  if (values.length === 0) return "{ }";
  if (values.length <= 3 && values.every((x) => typeof x === "number")) return values.join(", ");
  return values.map(summaryToken).join(" · ");
}

/**
 * A row's value as inline markup: the display text in the old inspector's `.scalar` styling,
 * muted for empty containers and unset values so they read as absence rather than data.
 */
export function InlineValue({ value }: { value: unknown }): JSX.Element {
  const text = displayValue(value);
  const muted = text === "[ ]" || text === "{ }" || text === "—";
  return <span className={muted ? "scalar muted" : "scalar"}>{text}</span>;
}

/**
 * A value compacted to a single token for a collapsed summary: coordinates as "5, 5", scalars
 * as-is, anything with real structure as "…".
 */
export function summaryToken(value: unknown): string {
  if (isScalar(value)) return scalarText(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? "[ ]" : value.every(isScalar) ? value.map(scalarText).join(", ") : "…";
  }
  const values = Object.values(value as Record<string, unknown>);
  if (values.length === 0) return "{ }";
  if (values.length <= 3 && values.every((x) => typeof x === "number")) return values.join(", ");
  return "…";
}
