import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { Logger } from "../logging/Logger";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import { getTableConfig, SQLiteTable } from "drizzle-orm/sqlite-core";
import { is } from "drizzle-orm";
import * as schema from "./schema";
import { MIGRATIONS, runMigrations } from "./migrations";
import { insertSettingSchema } from "./schema";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";

/**
 * CREATE TABLE IF NOT EXISTS, derived from the drizzle table definition itself: schema.ts
 * stays the single source of truth, with no handwritten DDL to drift out of sync. This is
 * what lets a fresh install boot (an empty db/database.db used to mean "no such table:
 * settings" and a crash), and an existing database passes through untouched.
 */
// ponytail: covers column types, NOT NULL and composite primary keys, which is all our
// schema uses. Defaults, uniques, indexes and foreign keys are unhandled, and ALTERing an
// existing table is out of scope entirely: that is the migration chain's half of the
// creation/transformation contract (see migrations.ts).
function createTableDdl(table: SQLiteTable): string {
  const cfg = getTableConfig(table);
  const columns = cfg.columns.map(
    (c) => `"${c.name}" ${c.getSQLType()}${c.primary ? " PRIMARY KEY" : ""}${c.notNull ? " NOT NULL" : ""}`,
  );
  const primaryKeys = cfg.primaryKeys.map(
    (pk) => `PRIMARY KEY (${pk.columns.map((c) => `"${c.name}"`).join(", ")})`,
  );
  return `CREATE TABLE IF NOT EXISTS "${cfg.name}" (${[...columns, ...primaryKeys].join(", ")})`;
}

// TODO: Check if needed and remove or implement.
export interface SettingId {
  domain: string;
  type: string;
  key: string;
}

export class CoreDatabase {
  private static _instance: CoreDatabase | undefined;

  private _logger: Logger;

  private _db: BetterSQLite3Database<typeof schema>;
  private _sqlite: Database.Database;

  public static getInstance(): CoreDatabase {
    if (!CoreDatabase._instance) {
      CoreDatabase._instance = new CoreDatabase();
    }
    return CoreDatabase._instance;
  }
  private constructor() {
    this._logger = new Logger(["DB", "CORE"]);

    // Ensure the folder where the db is made, exists.
    // TODO: Define this centrally somehow?
    const dbPath = path.join(process.cwd(), "/db/database.db");
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const sqlite = new Database(dbPath);
    // sqlite.pragma('journal_mode = WAL'); // TODO High-performance mode?

    // Decided before the bootstrap touches anything: a database with no settings table
    // has never held data, so once the bootstrap builds the current shape the migration
    // chain has nothing left to do and stamps itself done. An existing database keeps
    // its earned version (0 for anything from before the chain existed).
    const settingsTable = getTableConfig(schema.settings).name;
    const fresh =
      sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(settingsTable) === undefined;

    // Every table the schema module exports, so a table added there bootstraps without
    // this file hearing about it. Creation is the notable event (it means a fresh
    // database); a table already being present is everyday chatter.
    for (const value of Object.values(schema)) {
      if (!is(value, SQLiteTable)) continue;
      const { name } = getTableConfig(value);
      const existed =
        sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !== undefined;
      const ddl = createTableDdl(value);
      sqlite.exec(ddl);
      if (existed) this._logger.debug(`Table "${name}" already present.`);
      else this._logger.info(`Created table "${name}" in a fresh database.`, ddl);
    }

    // After creation, before anything reads: transform what older releases left behind.
    // A failing step throws through the constructor on purpose; on a managed device that
    // crash is what hands control to the supervisor's snapshot restore.
    const migrated = runMigrations(sqlite, MIGRATIONS, fresh);
    if (migrated.ran.length > 0)
      this._logger.important(`Migrated database from step ${migrated.from} to ${migrated.to}:`, migrated.ran);
    else this._logger.debug(`Database at schema step ${migrated.to}; no migrations to run.`);

    this._db = drizzle(sqlite, { schema });
    this._sqlite = sqlite;

    this._logger.info(`Database initialized at:`, dbPath);
  }

  /**
   * A consistent point-in-time copy of the live database at `dest`, through SQLite's own
   * backup API. This is the only sanctioned way to snapshot it: a plain file copy of an
   * open (WAL) database can capture a torn state.
   */
  public async backup(dest: string): Promise<void> {
    await this._sqlite.backup(dest);
  }

  public async updateSetting(
    domain: string,
    type: string,
    key: string,
    value: string,
  ): Promise<void> {
    const validation = insertSettingSchema.safeParse({
      domain,
      type,
      key,
      value,
    });
    if (!validation.success) {
      return this._logger.fatal("Invalid setting data:", validation.error);
    }

    await this._db
      .insert(schema.settings)
      .values(validation.data)
      .onConflictDoUpdate({
        target: [
          schema.settings.domain,
          schema.settings.type,
          schema.settings.key,
        ],
        set: { value: validation.data.value },
      });

    this._logger.info("Setting updated:", { domain, type, key });
    this._logger.debug("New value:", validation.data.value);
  }

  public async getSetting(
    domain: string,
    type: string,
    key: string,
  ): Promise<string | null> {
    const result = await this._db.query.settings.findFirst({
      where: (settings) =>
        and(eq(settings.domain, domain), eq(settings.type, type), eq(settings.key, key)),
    });
    return result?.value ?? null;
  }

  public async getSettingsByType(
    domain: string,
    type: string,
  ): Promise<Map<string, string>> {
    const results = await this._db.query.settings.findMany({
      where: (settings) =>
        and(eq(settings.domain, domain), eq(settings.type, type)),
    });
    return new Map(results.map(({ key, value }) => [key, value]));
  }

  public async deleteSetting(
    domain: string,
    type: string,
    key: string,
  ): Promise<void> {
    await this._db
      .delete(schema.settings)
      .where(
        and(
          eq(schema.settings.domain, domain),
          eq(schema.settings.type, type),
          eq(schema.settings.key, key),
        ),
      );

    this._logger.info("Setting deleted:", { domain, type, key });
  }
}
// Migrations live in migrations.ts (creation stays here, transformation there; the
// contract at the top of that file says why). createTableDdl doubles as migration zero.
