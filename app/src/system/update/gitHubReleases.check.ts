// Self-check for the release source's pure half: raw GitHub JSON maps to installable
// releases (tarball required, floor enforced, garbage dropped, newest first), and the
// repository URL forms package.json can carry all parse. Run with `yarn check`.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { GitHubReleases, mapReleases, parseGitHubRepo } from "./GitHubReleases";

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

// The cooldown counts from the last SUCCESS. A failed check (an offline boot) must stay
// retryable at once: returning its cached empty list as an answer hid the failure and left
// the check button dead for the whole cooldown (found on the Pi image, 2026-09-18).
{
  let fail = true;
  let hits = 0;
  const server = createServer((request, response) => {
    hits += 1;
    if (fail) return response.writeHead(500).end();
    if (request.url?.endsWith("/releases/latest")) return response.writeHead(404).end(); // no stable yet
    response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify([raw("v3.1.0")]));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const source = new GitHubReleases(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);

  await assert.rejects(source.check(), /500/);
  assert.notEqual(source.lastChecked, null, "a failed attempt is still recorded as checked");
  await assert.rejects(source.check(), /500/, "a failure starts no cooldown: the retry really asks again");
  assert.equal(hits, 2);

  fail = false;
  assert.deepEqual((await source.check()).map((release) => release.version), ["v3.1.0"]);
  assert.equal(hits, 4, "a success asks for the list and for latest");
  await source.check();
  assert.equal(hits, 4, "inside the cooldown after a success, the cached list answers");

  server.close();
}

console.log("gitHubReleases.check: all assertions passed");
