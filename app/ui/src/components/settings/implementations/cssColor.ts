// Hex colour with an alpha channel. Kept free of React so the round trip can be checked: the
// picker writes these strings straight into a user's config.

const HEX_COLOR = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const pair = (short: string): string => short + short;

/**
 * Split a hex colour into its opaque `#rrggbb` part and an alpha of 0 to 1, or null when the
 * value isn't hex at all. A colour field accepts any CSS colour (a keyword, `rgb()`, even a
 * whole gradient), and none of those have an alpha channel this can drive.
 */
export function parseHexAlpha(value: string | undefined): { rgb: string; alpha: number } | null {
  const raw = value?.trim() ?? "";
  if (!HEX_COLOR.test(raw)) return null;

  const digits = raw.slice(1);
  const shorthand = digits.length <= 4;
  const parts = shorthand
    ? [...digits].map(pair) // #rgb / #rgba expand each digit
    : [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6), digits.slice(6, 8)];

  const [r, g, b, a] = parts;
  return {
    rgb: `#${r}${g}${b}`.toLowerCase(),
    // Rounded to the precision the slider offers, so reading a value back and writing it again
    // lands on the same byte instead of drifting (0.5 -> 128 -> 0.5).
    alpha: a === undefined || a === "" ? 1 : Math.round((parseInt(a, 16) / 255) * 100) / 100,
  };
}

/**
 * Compose a colour back. Fully opaque drops the alpha pair, so a colour nobody made transparent
 * keeps the plain `#rrggbb` form it already had.
 */
export function formatHexAlpha(rgb: string, alpha: number): string {
  if (alpha >= 1) return rgb;
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  return `${rgb}${byte.toString(16).padStart(2, "0")}`;
}
