// Self-check for the version comparator: the full semver 11.4 ordering chain plus the
// exact bug this replaces (Beacon treating 3.0.0-beta as equal to 3.0.0). Run with `yarn check`.
import assert from "node:assert/strict";

import { compareVersions, isNewerVersion, parseVersion } from "./version";

// The ordering example straight from the semver spec, plus the stable release on top.
const ORDERED = [
  "1.0.0-alpha",
  "1.0.0-alpha.1",
  "1.0.0-alpha.beta",
  "1.0.0-beta",
  "1.0.0-beta.2",
  "1.0.0-beta.11",
  "1.0.0-rc.1",
  "1.0.0",
  "1.0.1",
  "1.1.0",
  "2.0.0",
];
for (let i = 0; i < ORDERED.length; i++) {
  for (let j = 0; j < ORDERED.length; j++) {
    const [a, b] = [parseVersion(ORDERED[i]), parseVersion(ORDERED[j])];
    assert.ok(a && b, `${ORDERED[i]} and ${ORDERED[j]} parse`);
    assert.equal(
      Math.sign(compareVersions(a, b)),
      Math.sign(i - j),
      `${ORDERED[i]} vs ${ORDERED[j]} orders by list position`,
    );
  }
}

// The Beacon bug: beta -> stable must be visible as an update.
assert.equal(isNewerVersion("3.0.0", "3.0.0-beta"), true, "stable is newer than its beta");
assert.equal(isNewerVersion("3.0.0-beta", "3.0.0"), false, "beta is not newer than stable");

// Tag hygiene: v-prefix accepted, equal tags compare equal across prefixes.
const [vTag, bare] = [parseVersion("v3.1.0"), parseVersion("3.1.0")];
assert.ok(vTag && bare, "v-prefixed and bare tags parse");
assert.equal(compareVersions(vTag, bare), 0, "v3.1.0 equals 3.1.0");

// Garbage never parses, and never wins a newer-than question.
for (const junk of ["", "main", "3.0", "3.0.0.1", "v3.0.0 ", "3.0.0-"]) {
  assert.equal(parseVersion(junk), null, `"${junk}" does not parse`);
  assert.equal(isNewerVersion(junk, "0.0.1"), false, `"${junk}" is never newer`);
  assert.equal(isNewerVersion("999.0.0", junk), false, `nothing is newer than "${junk}"`);
}

console.log("version.check: all assertions passed");
