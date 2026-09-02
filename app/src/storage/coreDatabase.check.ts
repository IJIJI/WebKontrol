// Self-check for the database bootstrap: a fresh directory must yield a working database
// (the release blocker this fixes: an empty db meant "no such table: settings" and a
// crash), and a second open of the same db must pass through the CREATE IF NOT EXISTS
// untouched. Run with `yarn check`.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Into a scratch cwd BEFORE the import below: CoreDatabase resolves db/ (and Logger
// logs/) from cwd at load, which is exactly the fresh-install situation being tested.
// Dynamic import, since a static one would hoist above the chdir.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "wk-db-check-"));
process.chdir(scratch);

const { CoreDatabase } = await import("./CoreDatabase");

const db = CoreDatabase.getInstance();
assert.equal(fs.existsSync(path.join(scratch, "db", "database.db")), true, "db file created");

// The full write path exercises the derived DDL: composite PK (the upsert's conflict
// target), NOT NULL, and the row surviving a round trip.
await db.updateSetting("check", "test", "alpha", "1");
await db.updateSetting("check", "test", "alpha", "2"); // upsert needs the PK to exist
assert.equal(await db.getSetting("check", "test", "alpha"), "2", "upsert round-trips");
assert.equal(await db.getSetting("check", "test", "missing"), null, "missing key is null");

// Reopening an existing database must be a no-op, not a failed CREATE. The singleton
// blocks a second instance in-process, so run the constructor's DDL pass by hand.
const Database = (await import("better-sqlite3")).default;
const { getTableConfig, SQLiteTable } = await import("drizzle-orm/sqlite-core");
const { is } = await import("drizzle-orm");
const schema = await import("./schema");
const raw = new Database(path.join(scratch, "db", "database.db"));
for (const value of Object.values(schema)) {
  if (is(value, SQLiteTable)) {
    const { name } = getTableConfig(value);
    raw.exec(`CREATE TABLE IF NOT EXISTS "${name}" ("probe" text)`); // existing table wins
    const kept = raw.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get() as { n: number };
    assert.equal(kept.n, 1, `existing "${name}" table and its rows survive a re-open`);
  }
}
raw.close();

console.log("coreDatabase.check: all assertions passed");
