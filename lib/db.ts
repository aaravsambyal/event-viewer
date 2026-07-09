import initSqlJs, { SqlJsStatic, Database as SqlJsDatabase } from "sql.js";
import path from "path";
import bcrypt from "bcryptjs";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "portal.db");

class Statement {
  constructor(
    private db: SqlJsDatabase,
    private sql: string,
  ) {}

  all(...params: any[]): any[] {
    const stmt = this.db.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    const rows: any[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  get(...params: any[]): any | undefined {
    const stmt = this.db.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    const hasRow = stmt.step();
    if (!hasRow) { stmt.free(); return undefined; }
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }

  run(...params: any[]): { lastInsertRowid: number | bigint; changes: number } {
    this.db.run(this.sql, params);
    const result = this.db.exec("SELECT last_insert_rowid() as id, changes() as changes");
    const lastInsertRowid = (result[0]?.values[0]?.[0] ?? 0) as number;
    const changes = (result[0]?.values[0]?.[1] ?? 0) as number;
    saveToDisk(this.db);
    return { lastInsertRowid, changes };
  }
}

class DbSession {
  constructor(private db: SqlJsDatabase) {}

  pragma(sql: string) {
    this.db.run(`PRAGMA ${sql}`);
  }

  exec(sql: string) {
    this.db.exec(sql);
  }

  prepare(sql: string) {
    return new Statement(this.db, sql);
  }
}

let SQL: SqlJsStatic | null = null;
let _db: DbSession | null = null;
let _initPromise: Promise<DbSession> | null = null;

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!SQL) SQL = await initSqlJs();
  return SQL;
}

function saveToDisk(database: SqlJsDatabase) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = database.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function getDb(): Promise<DbSession> {
  if (_db) return _db;
  if (!_initPromise) {
    _initPromise = (async () => {
      const sql = await getSqlJs();
      const buffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
      const rawDb = new sql.Database(buffer);
      rawDb.run("PRAGMA foreign_keys = ON");
      const db = new DbSession(rawDb);
      initSchema(db);
      migrateData(db);
      saveToDisk(rawDb);
      _db = db;
      return db;
    })();
  }
  return _initPromise;
}

function initSchema(db: DbSession) {
  db.pragma("foreign_keys = OFF");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
      department TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT,
      state TEXT,
      district TEXT,
      department TEXT,
      type TEXT NOT NULL DEFAULT 'main' CHECK(type IN ('main', 'sub')),
      parent_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed')),
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_members (
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT,
      caption TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  for (const col of [
    "department TEXT",
    "department TEXT",
    "type TEXT NOT NULL DEFAULT 'main'",
    "parent_id INTEGER REFERENCES events(id)",
    "participant_count INTEGER DEFAULT 0",
    "security_question TEXT",
    "security_answer TEXT",
    "closing_date TEXT",
    "country TEXT",
    "state TEXT",
    "district TEXT",
  ]) {
    try { db.exec(`ALTER TABLE events ADD COLUMN ${col}`); } catch {}
  }
  try { db.exec(`ALTER TABLE users ADD COLUMN department TEXT`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN security_question TEXT`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN security_answer TEXT`); } catch {}

  db.pragma("foreign_keys = ON");
}

function migrateData(db: DbSession) {
  const hostCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='host'").get() as any)?.c ?? 0;
  if (hostCount > 0) {
    db.prepare("UPDATE users SET role='member' WHERE role='host'").run();
    console.log(`[DB] Migrated ${hostCount} host(s) → member role`);
  }

  const publicCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='public'").get() as any)?.c ?? 0;
  if (publicCount > 0) {
    db.prepare("DELETE FROM users WHERE role='public'").run();
    console.log(`[DB] Removed ${publicCount} public-role user(s)`);
  }

  const nullDateCount = (db.prepare("SELECT COUNT(*) as c FROM events WHERE event_date IS NULL OR event_date = ''").get() as any)?.c ?? 0;
  if (nullDateCount > 0) {
    db.prepare("UPDATE events SET event_date = datetime('now') WHERE event_date IS NULL OR event_date = ''").run();
    console.log(`[DB] Set event_date for ${nullDateCount} event(s) that had no date`);
  }
  const nullLocCount = (db.prepare("SELECT COUNT(*) as c FROM events WHERE location IS NULL OR location = ''").get() as any)?.c ?? 0;
  if (nullLocCount > 0) {
    db.prepare("UPDATE events SET location = 'Unknown' WHERE location IS NULL OR location = ''").run();
    console.log(`[DB] Set location for ${nullLocCount} event(s) that had no location`);
  }
}
