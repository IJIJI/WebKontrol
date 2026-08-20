// Self-check for the apply gate: every refusal reason fires, and the two allowed shapes
// (upgrade, lossless downgrade) pass. Run with `yarn check`.
import assert from "node:assert/strict";

import type { Release } from "./model";
import { applyGate } from "./UpdateManager";

const release = (version: string): Release => ({
  version,
  name: version,
  notes: "",
  publishedAt: "2026-08-18T00:00:00Z",
  prerelease: false,
  assetUrl: `https://example.test/${version}.tar.gz`,
});

const base = {
  managed: true,
  applying: false,
  pendingExists: false,
  current: "v3.0.0",
  target: release("v3.1.0"),
  crossedVersions: [] as string[],
};

// The allowed shapes.
assert.equal(applyGate(base), null, "an upgrade passes");
assert.equal(
  applyGate({ ...base, current: "v3.1.0", target: release("v3.0.0") }),
  null,
  "a downgrade crossing no migration is lossless and passes",
);

//* The migration gate. Which versions a downgrade crosses is derived by
//* crossedMigrations (checked in migrations.check.ts); the gate only judges the result.
assert.match(
  String(
    applyGate({ ...base, current: "v3.1.0", target: release("v3.0.0"), crossedVersions: ["3.1.0"] }),
  ),
  /database changes of 3\.1\.0 would lose data/,
  "a downgrade across a migration is lossy and names what it would lose",
);

// Every refusal, one condition at a time.
assert.match(String(applyGate({ ...base, managed: false })), /managed by git/);
assert.match(String(applyGate({ ...base, applying: true })), /already in progress/);
assert.match(String(applyGate({ ...base, pendingExists: true })), /still being confirmed/);
assert.match(String(applyGate({ ...base, target: undefined })), /Unknown release/, "the allowlist");
assert.match(String(applyGate({ ...base, target: release("v3.0.0") })), /already running/);

console.log("updateManager.check: all assertions passed");
