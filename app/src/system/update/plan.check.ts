// Self-check for the update plan: full step order for an upgrade, the downgrade fast
// path, and the crash-safety ordering (snapshot and pending on disk before the repoint).
// Run with `yarn check`.
import assert from "node:assert/strict";

import type { Release } from "./model";
import { planUpdate, type UpdateStep } from "./plan";

const release = (version: string): Release => ({
  version,
  name: version,
  notes: "",
  publishedAt: "2026-08-18T00:00:00Z",
  prerelease: false,
  assetUrl: `https://example.test/${version}.tar.gz`,
});

const kinds = (steps: UpdateStep[]): string[] => steps.map((step) => step.kind);

// Upgrade: the full sequence, in order.
const upgrade = planUpdate({ from: "v3.0.0", to: release("v3.1.0"), targetPresent: false });
assert.deepEqual(kinds(upgrade), [
  "clean-staging",
  "download",
  "extract",
  "install-deps",
  "promote",
  "snapshot-db",
  "write-pending",
  "activate",
  "adopt-supervisor",
  "sweep-releases",
]);

// Crash safety: everything rollback needs exists before `current` is repointed.
assert.ok(
  kinds(upgrade).indexOf("snapshot-db") < kinds(upgrade).indexOf("write-pending") &&
    kinds(upgrade).indexOf("write-pending") < kinds(upgrade).indexOf("activate"),
  "snapshot, then pending marker, then repoint",
);

// The steps carry their data: download from the asset, pending records the swap,
// retention keeps exactly the new and the previous release.
const byKind = Object.fromEntries(upgrade.map((step) => [step.kind, step]));
assert.deepEqual(byKind["download"], { kind: "download", url: "https://example.test/v3.1.0.tar.gz" });
assert.deepEqual(byKind["promote"], { kind: "promote", version: "v3.1.0" });
assert.deepEqual(byKind["write-pending"], { kind: "write-pending", from: "v3.0.0", to: "v3.1.0" });
assert.deepEqual(byKind["sweep-releases"], { kind: "sweep-releases", keep: ["v3.1.0", "v3.0.0"] });

// Downgrade to a release still on disk: no fetch half, the swap half unchanged.
const downgrade = planUpdate({ from: "v3.1.0", to: release("v3.0.0"), targetPresent: true });
assert.deepEqual(kinds(downgrade), [
  "snapshot-db",
  "write-pending",
  "activate",
  "adopt-supervisor",
  "sweep-releases",
]);

console.log("plan.check: all assertions passed");
