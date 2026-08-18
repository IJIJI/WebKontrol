// Self-check for the release source's pure half: raw GitHub JSON maps to installable
// releases (tarball required, floor enforced, garbage dropped, newest first), and the
// repository URL forms package.json can carry all parse. Run with `yarn check`.
import assert from "node:assert/strict";

import { mapReleases, parseGitHubRepo } from "./GitHubReleases";

const raw = (tag: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  tag_name: tag,
  name: `Release ${tag}`,
  body: "notes",
  published_at: "2026-08-18T00:00:00Z",
  prerelease: tag.includes("-"),
  assets: [
    { name: "irrelevant.txt", browser_download_url: `https://example.test/${tag}.txt` },
    { name: `webkontrol-${tag}.tar.gz`, browser_download_url: `https://example.test/${tag}.tar.gz` },
  ],
  ...extra,
});

const releases = mapReleases([
  raw("v3.0.0"),
  raw("v3.1.0"),
  raw("v3.0.0-beta"),          // the floor itself stays
  raw("v2.9.0"),               // below the floor: predates artifacts
  raw("nightly"),              // unparsable tag
  raw("v3.2.0", { assets: [] }), // no tarball asset: not installable
  raw("v3.0.1", { name: "", body: null }), // degenerate fields fall back
]);

// Order is newest first; the uninstallable entries are gone entirely.
assert.deepEqual(
  releases.map((release) => release.version),
  ["v3.1.0", "v3.0.1", "v3.0.0", "v3.0.0-beta"],
);

// Fields map, and the asset picked is the tarball, not the first asset.
const first = releases[0];
assert.equal(first.name, "Release v3.1.0");
assert.equal(first.notes, "notes");
assert.equal(first.prerelease, false);
assert.equal(first.assetUrl, "https://example.test/v3.1.0.tar.gz");
assert.equal(releases.find((release) => release.version === "v3.0.0-beta")?.prerelease, true);

// Degenerate fields: empty name falls back to the tag, null body to "".
const degenerate = releases.find((release) => release.version === "v3.0.1");
assert.equal(degenerate?.name, "v3.0.1");
assert.equal(degenerate?.notes, "");

// Non-array payloads (API error bodies) map to no releases rather than a throw.
assert.deepEqual(mapReleases({ message: "rate limited" }), []);
assert.deepEqual(mapReleases(null), []);

// Repository URL forms.
assert.equal(parseGitHubRepo("git+https://github.com/ijiji/WebKontrol.git"), "ijiji/WebKontrol");
assert.equal(parseGitHubRepo("https://github.com/owner/repo"), "owner/repo");
assert.equal(parseGitHubRepo("git@github.com:owner/repo.git"), "owner/repo");
assert.equal(parseGitHubRepo("https://gitlab.com/owner/repo"), null);

console.log("gitHubReleases.check: all assertions passed");
