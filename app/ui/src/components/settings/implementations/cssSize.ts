// One axis of a block's size: either a sizing keyword or a CSS length. Kept separate from the
// widget so the parsing is checkable without a DOM (see blockUtils.check.ts).

/** Units offered for a length. Free text still accepts anything CSS does; these are the assists. */
export const SIZE_UNITS = ["px", "%", "vw", "vh", "em", "rem"] as const;
export type SizeUnit = (typeof SIZE_UNITS)[number];

/** The keywords the box speaks, alongside any length. */
export const SIZE_KEYWORDS = ["content", "container"] as const;
export type SizeKeyword = (typeof SIZE_KEYWORDS)[number];

export interface SizeValue {
  /** Set when the axis is a keyword rather than a measurement. */
  keyword?: SizeKeyword;
  /** Absent means unset: the block's own default applies. */
  value?: number;
  unit: SizeUnit;
}

const LENGTH = new RegExp(`^(-?(?:\\d+\\.?\\d*|\\.\\d+))(${SIZE_UNITS.map((u) => (u === "%" ? "%" : u)).join("|")})?$`);

const EMPTY: SizeValue = { unit: "px" };

/**
 * Read one axis. Returns null when the value is not a keyword or a plain length (`calc()`,
 * `fit-content`, `auto`), which is the signal for the widget to fall back to raw text rather
 * than silently rewriting something it does not understand.
 */
export function parseSize(raw: string | undefined): SizeValue | null {
  const trimmed = raw?.trim() ?? "";
  if (trimmed === "") return EMPTY;

  const keyword = SIZE_KEYWORDS.find((word) => word === trimmed);
  if (keyword) return { keyword, unit: "px" };

  const match = LENGTH.exec(trimmed);
  if (!match) return null;
  // A bare number is px, matching how the box editor reads its shorthands.
  return { value: Number(match[1]), unit: (match[2] as SizeUnit | undefined) ?? "px" };
}

/** Back to the stored string. Undefined means unset, so the axis falls back to the block default. */
export function formatSize({ keyword, value, unit }: SizeValue): string | undefined {
  if (keyword) return keyword;
  if (value === undefined) return undefined;
  // Zero needs no unit, and carrying one round-trips as noise through every save.
  return value === 0 ? "0" : `${value}${unit}`;
}
