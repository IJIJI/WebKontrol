// Self-check for the migration runner, against in-memory databases: steps advance the
// version and run exactly once, a fresh database stamps at the top without running
// anything, a throwing step leaves data AND version untouched (the assertion that
// matters), and a database from newer code is refused loudly. The fake chain here
// creates its own scratch tables, which the real chain's contract forbids: that contract
// governs steps versus the schema bootstrap, while this file tests the runner mechanics.
// Run with `yarn check`.
import assert from "node:assert/strict";
import Database from "better-sqlite3";

import pkg from "../../package.json" with { type: "json" };
import { isNewerVersion, parseVersion } from "../system/update/version";
import { crossedMigrations, MIGRATIONS, runMigrations, type Migration } from "./migrations";

const countRows = (db: Database.Database): number =>
  (db.prepare("SELECT COUNT(*) AS n FROM scratch").get() as { n: number }).n;

let step1Runs = 0;
const chain: Migration[] = [
  {
    version: "3.1.0",
    description: "create scratch table",
    up: (db) => {
      step1Runs++;
      db.exec("CREATE TABLE scratch (id INTEGER PRIMARY KEY, label TEXT NOT NULL)");
      db.prepare("INSERT INTO scratch (label) VALUES (?)").run("from step 0");
    },
  },
  {
    version: "3.4.0",
    description: "add a second row",
    up: (db) => {
      db.prepare("INSERT INTO scratch (label) VALUES (?)").run("from step 1");
    },
  },
];

// An old database (not fresh, version 0) runs the whole chain, in order, once.
{
  const db = new Database(":memory:");
  const result = runMigrations(db, chain, false);
  assert.deepEqual(result, { from: 0, to: 2, ran: ["create scratch table", "add a second row"] });
  assert.equal(db.pragma("user_version", { simple: true }), 2);
  assert.equal(countRows(db), 2);

  // A second boot is a no-op: nothing reruns, nothing changes.
  const again = runMigrations(db, chain, false);
  assert.deepEqual(again, { from: 2, to: 2, ran: [] });
  assert.equal(step1Runs, 1, "steps run exactly once across boots");
  db.close();
}

// A database already mid-chain only runs what it is missing.
{
  const db = new Database(":memory:");
  chain[0].up(db);
  db.pragma("user_version = 1");
  const result = runMigrations(db, chain, false);
  assert.deepEqual(result.ran, ["add a second row"]);
  assert.equal(countRows(db), 2);
  db.close();
}

// A fresh database stamps at the top without running a single step: the bootstrap
// already built the current shape.
{
  const db = new Database(":memory:");
  const runsBefore = step1Runs;
  const result = runMigrations(db, chain, true);
  assert.deepEqual(result, { from: 0, to: 2, ran: [] });
  assert.equal(db.pragma("user_version", { simple: true }), 2);
  assert.equal(step1Runs, runsBefore, "fresh databases run nothing");
  db.close();
}

// A throwing step leaves both the data and the version exactly as they were: the step
// either fully happened or did not happen at all.
{
  const db = new Database(":memory:");
  const exploding: Migration[] = [
    chain[0],
    {
      version: "3.4.0",
      description: "write then explode",
      up: (innerDb) => {
        innerDb.prepare("INSERT INTO scratch (label) VALUES (?)").run("must roll back");
        throw new Error("boom");
      },
    },
  ];
  assert.throws(() => runMigrations(db, exploding, false), /step 1.*write then explode.*remains at step 1/s);
  assert.equal(db.pragma("user_version", { simple: true }), 1, "version stops before the failed step");
  assert.equal(countRows(db), 1, "the failed step's write rolled back");
  db.close();
}

// A database from newer code is refused, not guessed at.
{
  const db = new Database(":memory:");
  db.pragma("user_version = 99");
  assert.throws(() => runMigrations(db, chain, false), /older than the data/);
  db.close();
}

// What a downgrade would cross, derived from the chain alone: the downgrading side is
// always the newer one, so it always holds the full history and nothing needs fetching.
{
  const versions = (target: string, current: string): string[] =>
    crossedMigrations(chain.map((migration) => migration.version), target, current);
  assert.deepEqual(versions("3.0.0", "3.5.0"), ["3.1.0", "3.4.0"], "a downgrade across both");
  assert.deepEqual(versions("3.2.0", "3.5.0"), ["3.4.0"], "a downgrade across one");
  assert.deepEqual(versions("3.4.0", "3.5.0"), [], "down to the release that migrated: lossless");
  assert.deepEqual(versions("3.4.0", "3.4.0"), [], "same version crosses nothing");
  assert.deepEqual(versions("3.5.0", "3.0.0"), [], "an upgrade never crosses, by construction");
  assert.deepEqual(versions("v3.2.0", "v3.5.0"), ["3.4.0"], "tag prefixes compare fine");
}

// The chain's structural invariants, which replace any hand-bumped counter: every entry
// names a real, parseable release no newer than this build, and the chain only ever
// appends (non-decreasing versions). Vacuous while the chain is empty; they bite the
// moment the first real entry lands.
for (const [index, migration] of MIGRATIONS.entries()) {
  assert.ok(parseVersion(migration.version), `entry ${index} names a parseable version`);
  assert.ok(
    !isNewerVersion(migration.version, pkg.version),
    `entry ${index} (${migration.version}) cannot belong to a release newer than this build`,
  );
  if (index > 0)
    assert.ok(
      !isNewerVersion(MIGRATIONS[index - 1].version, migration.version),
      `entries are ordered: ${index - 1} must not be newer than ${index}`,
    );
}

console.log("migrations.check: all assertions passed");
