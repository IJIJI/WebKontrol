// Parsing and formatting for a CSS grid track list ("1fr 2fr auto"). Kept free of React so the
// round trip can be checked: a bug here rewrites someone's layout.

/** The track sizes the editor offers. `auto` is a keyword, so it carries no number. */
export const TRACK_UNITS = ["fr", "px", "%", "auto"] as const;
export type TrackUnit = (typeof TRACK_UNITS)[number];

export interface Track {
  /** Absent for `auto`, which sizes itself. */
  value?: number;
  unit: TrackUnit;
}

const SIZED = /^(\d+(?:\.\d+)?)(fr|px|%)$/;

/**
 * Read a track list. An empty string is no tracks at all, which is how the grid says "arrange
 * these automatically" rather than an error. Returns null for anything the editor can't
 * represent (minmax, repeat, calc), which the schema's own pattern already rejects.
 */
export function parseTracks(raw: string | undefined): Track[] | null {
  const trimmed = raw?.trim() ?? "";
  if (trimmed === "") return [];

  const tracks: Track[] = [];
  for (const token of trimmed.split(/\s+/)) {
    if (token === "auto") {
      tracks.push({ unit: "auto" });
      continue;
    }
    const match = SIZED.exec(token);
    if (!match) return null;
    tracks.push({ value: Number(match[1]), unit: match[2] as TrackUnit });
  }
  return tracks;
}

/** Write a track list back, or undefined when there are none, so the field clears to automatic. */
export function formatTracks(tracks: readonly Track[]): string | undefined {
  if (tracks.length === 0) return undefined;
  return tracks.map((track) => (track.unit === "auto" ? "auto" : `${track.value ?? 0}${track.unit}`)).join(" ");
}

