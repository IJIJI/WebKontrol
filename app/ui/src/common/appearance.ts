// Entity appearance constants (colour side; icons live in the icon registry).

// Fallback colour for entities without a chosen colour.
export const DEFAULT_ENTITY_COLOR = "#a3a0a8";

// Preset swatches for the colour picker. Deliberately not the status/variant 
// colours, so a chosen colour never implies state. "Default" (no colour) is a
// separate option in the picker, so the neutral grey isn't listed here.
export const COLOR_PALETTE: string[] = [
  "#e85d30",
  "#e93838",
  "#d4930a",
  "#16b658",
  "#0ea5b7",
  "#185fa5",
  "#7c5cff",
  "#c8407f",
  "#6b7280",
];
