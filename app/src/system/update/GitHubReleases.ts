import pkg from "../../../package.json" with { type: "json" };
import { Logger } from "../../logging/Logger";
import type { Release } from "./model";
import { compareVersions, isNewerVersion, parseVersion, type ParsedVersion } from "./version";

/**
 * The release source: what is published, straight from the GitHub releases API.
 * Knows nothing about applying; the manager asks it what exists and gates from there.
 * The base URL is injectable so the e2e run can point it at a local fake GitHub.
 */

// Oldest installable release: the first one that ships an update tarball. Anything older
// predates the artifact machinery, so offering it would produce a broken install.
const FLOOR_VERSION = "3.0.0-beta";
const MIN_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const HTTP_TIMEOUT_MS = 15 * 1000;

/** Extracts "owner/repo" from the https and ssh GitHub URL forms package.json can carry. */
export function parseGitHubRepo(url: string): string | null {
  const match = /github\.com[/:]([^/]+\/[^/.]+)/.exec(url);
  return match ? match[1] : null;
}

/**
 * The pure mapping half, split out for the check file: raw API JSON in, installable
 * releases out, newest first. Installable = a parseable version tag, at or above the
 * floor, carrying a .tar.gz asset; everything else is dropped rather than shown broken.
 */
export function mapReleases(raw: unknown): Release[] {
  if (!Array.isArray(raw)) return [];
  const mapped: { release: Release; parsed: ParsedVersion }[] = [];
  for (const entry of raw as Record<string, unknown>[]) {
    const version = typeof entry["tag_name"] === "string" ? entry["tag_name"] : "";
    const parsed = parseVersion(version);
    if (!parsed || isNewerVersion(FLOOR_VERSION, version)) continue;

    const assets = Array.isArray(entry["assets"]) ? (entry["assets"] as Record<string, unknown>[]) : [];
    const tarball = assets.find(
      (asset) => typeof asset["name"] === "string" && asset["name"].endsWith(".tar.gz"),
    );
    if (!tarball || typeof tarball["browser_download_url"] !== "string") continue;

    mapped.push({
      parsed,
      release: {
        version,
        name: typeof entry["name"] === "string" && entry["name"] !== "" ? entry["name"] : version,
        notes: typeof entry["body"] === "string" ? entry["body"] : "",
        publishedAt: typeof entry["published_at"] === "string" ? entry["published_at"] : "",
        prerelease: entry["prerelease"] === true,
        assetUrl: tarball["browser_download_url"],
      },
    });
  }
  return mapped
    .sort((a, b) => compareVersions(b.parsed, a.parsed))
    .map((entry) => entry.release);
}

export class GitHubReleases {
  private _logger = new Logger(["UPDATE", "SOURCE"]);
  private _releases: Release[] = [];
  // The tag GitHub itself marks as latest: newest stable by default, and whatever the
  // maintainer sets it to by hand. The single source of truth for "is there an update",
  // shared with the installer's default; prereleases are never latest, by GitHub's rules.
  private _latest: string | null = null; // TODO: This can be cleaner
  private _lastChecked: number | null = null;
  private _inflight: Promise<Release[]> | null = null;

  constructor(private readonly _baseUrl = "https://api.github.com") {}

  get releases(): Release[] {
    return this._releases;
  }
  get lastChecked(): number | null {
    return this._lastChecked;
  }
  get latest(): string | null {
    return this._latest;
  }

  /**
   * Fetch what is published. Throws on failure (the manager records the message).
   * Concurrent callers share one request, and inside the cooldown the cached list is
   * returned, failures included: a down network is not hammered by the check button.
   */
  async check(): Promise<Release[]> {
    if (this._inflight) return this._inflight;
    if (this._lastChecked !== null && Date.now() < this._lastChecked + MIN_CHECK_INTERVAL_MS) {
      this._logger.debug("Checked recently, returning the cached release list.");
      return this._releases;
    }
    this._inflight = this._fetch().finally(() => {
      this._lastChecked = Date.now();
      this._inflight = null;
    });
    return this._inflight;
  }

  private async _fetch(): Promise<Release[]> {
    const repo = parseGitHubRepo(pkg.repository.url);
    if (!repo) throw new Error("No GitHub repository URL in package.json");

    this._logger.info("Checking for updates...");
    // One page of 100: GitHub pages at 30 by default, and a latest that fell off the
    // page would never be announced (it must be in the list).
    const response = await fetch(`${this._baseUrl}/repos/${repo}/releases?per_page=100`, {
      headers: { "User-Agent": "WebKontrol", Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`GitHub releases API error: ${response.status}`);

    const releases = mapReleases(await response.json());

    // 404 here is a state, not a failure: no stable release exists (yet), so nothing is
    // announced. Any OTHER failure is a failed check, exactly like the list failing: a
    // rate limit read as "no update" would silence announcements until the next daily
    // check, invisibly, whereas a failed check is shown and can be retried.
    const latestResponse = await fetch(`${this._baseUrl}/repos/${repo}/releases/latest`, {
      headers: { "User-Agent": "WebKontrol", Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    let latest: string | null = null; // 404 stays null: no stable release exists yet
    if (latestResponse.ok) {
      const latestBody = (await latestResponse.json()) as { tag_name?: unknown };
      latest = typeof latestBody.tag_name === "string" ? latestBody.tag_name : null;
    } else if (latestResponse.status !== 404) {
      throw new Error(`GitHub latest-release API error: ${latestResponse.status}`);
    }

    // Assigned together, after both requests: a check that failed halfway leaves the
    // previous consistent pair in place instead of a new list beside a stale latest.
    this._releases = releases;
    this._latest = latest;

    this._logger.info(
      `Found ${this._releases.length} installable release(s); latest stable is ${this._latest ?? "none"}.`,
    );
    return this._releases;
  }
}
