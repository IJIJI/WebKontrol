import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { Logger } from "../logging/Logger";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { insertSettingSchema } from "./schema";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";

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

    this._db = drizzle(sqlite, { schema });

    this._logger.info(`Database initialized at:`, dbPath);
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

    this._logger.info("Setting updated:", validation.data);
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
// TODO: Autogen DB!
// TODO: Add migration support between versions. In supervisor?
/*
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'; // 👈 Import the migrator
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

const sqlite = new Database('settings.db');
export const db = drizzle(sqlite, { schema });

// This automatically creates or updates your tables on startup!
try {
  migrate(db, { 
    // Point this to the folder generated in Step 1
    migrationsFolder: path.join(__dirname, '../../drizzle') 
  });
  console.log("Database tables synchronized successfully.");
} catch (error) {
  console.error("Failed to run database migrations:", error);
}
*/
