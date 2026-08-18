// Version ordering for release tags, prerelease-aware. Beacon's compare strips the
// prerelease part, which makes "3.0.0-beta" equal to "3.0.0" and hides the beta->stable
// update; this one follows the semver ordering rules instead (11.4: prerelease < release,
// identifiers compared numerically when numeric, lexically otherwise, numeric < alpha).

export interface ParsedVersion {
  core: [number, number, number];
  /** The part after "-" split on dots ("-beta.2" becomes ["beta", "2"]), null for a stable release. */
  pre: string[] | null;
}

/** Accepts "3.0.0", "v3.0.0-beta.2" etc.; null for anything else (never throws). */
export function parseVersion(tag: string): ParsedVersion | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(tag);
  if (!match) return null;
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    pre: match[4] === undefined ? null : match[4].split("."),
  };
}

/** Standard comparator contract: negative when a is older, zero when equal, positive when a is newer. */
export function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i]) return a.core[i] - b.core[i];
  }
  if (a.pre === null || b.pre === null)
    return (a.pre === null ? 1 : 0) - (b.pre === null ? 1 : 0);

  for (let i = 0; i < Math.min(a.pre.length, b.pre.length); i++) {
    const [x, y] = [a.pre[i], b.pre[i]];
    if (x === y) continue;
    const [xNum, yNum] = [/^\d+$/.test(x), /^\d+$/.test(y)];
    if (xNum && yNum) return Number(x) - Number(y);
    if (xNum !== yNum) return xNum ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return a.pre.length - b.pre.length;
}

/** Convenience for tag strings; an unparsable side is never newer than anything. */
export function isNewerVersion(a: string, b: string): boolean {
  const [pa, pb] = [parseVersion(a), parseVersion(b)];
  if (!pa || !pb) return false;
  return compareVersions(pa, pb) > 0;
}
