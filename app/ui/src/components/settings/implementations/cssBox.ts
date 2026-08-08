// Parsing and formatting for CSS box shorthands (padding, margin, border-radius): the four-value
// form with its 1/2/3-value shortcuts. Kept free of React so the round-trip can be checked
// directly, since a bug here silently rewrites a user's styling.

/** The units the box editor offers. Anything else falls back to editing the raw string. */
export const BOX_UNITS = ["px", "%", "em", "rem"] as const;

/** Four sides (top, right, bottom, left) or corners (TL, TR, BR, BL); blank means unset. */
export type BoxSides = [number | undefined, number | undefined, number | undefined, number | undefined];

export interface BoxValue {
  sides: BoxSides;
  unit: string;
}

// A single length: a number with one of the offered units, or a bare 0 (unitless zero is the one
// length CSS lets you write without a unit).
const LENGTH = new RegExp(`^(-?(?:\\d+\\.?\\d*|\\.\\d+))(${BOX_UNITS.join("|")})?$`);

const EMPTY: BoxValue = { sides: [undefined, undefined, undefined, undefined], unit: "px" };

/**
 * Read a shorthand into four values, or null when it is not a plain length list: mixed units,
 * keywords like `auto`, `calc()`, or border-radius' elliptical `/` form all land there, and the
 * editor shows the raw string instead of silently mangling them.
 */
export function parseBox(raw: string | undefined): BoxValue | null {
  const trimmed = raw?.trim() ?? "";
  if (trimmed === "") return EMPTY;

  const tokens = trimmed.split(/\s+/);
  if (tokens.length > 4) return null;

  const numbers: number[] = [];
  const units = new Set<string>();
  for (const token of tokens) {
    const match = LENGTH.exec(token);
    if (!match) return null;
    const value = Number(match[1]);
    numbers.push(value);
    // A zero carries no unit opinion, so it never conflicts with the rest.
    if (match[2] !== undefined && value !== 0) units.add(match[2]);
    else if (match[2] === undefined && value !== 0) return null; // a non-zero length needs a unit
  }
  if (units.size > 1) return null;

  const [a, b = a, c = a, d = b] = numbers; // the CSS 1/2/3/4-value expansion
  return { sides: [a, b, c, d], unit: [...units][0] ?? "px" };
}

/**
 * Write four values back as the shortest equivalent shorthand, or undefined when every side is
 * blank, so clearing the editor unsets the field rather than storing an empty string.
 */
export function formatBox({ sides, unit }: BoxValue): string | undefined {
  if (sides.every((side) => side === undefined)) return undefined;

  // A blank side among set ones is a zero: the shorthand has no way to skip a position.
  const [top, right, bottom, left] = sides.map((side) => side ?? 0);
  const length = (value: number): string => (value === 0 ? "0" : `${value}${unit}`);

  if (top === right && right === bottom && bottom === left) return length(top);
  if (top === bottom && right === left) return `${length(top)} ${length(right)}`;
  if (right === left) return `${length(top)} ${length(right)} ${length(bottom)}`;
  return `${length(top)} ${length(right)} ${length(bottom)} ${length(left)}`;
}

/** Whether every side holds the same value, i.e. the editor can show one linked input. */
export function isUniform({ sides }: BoxValue): boolean {
  return sides.every((side) => side === sides[0]);
}
