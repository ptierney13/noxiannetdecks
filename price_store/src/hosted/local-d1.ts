import { mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1AllResult, D1DatabaseLike, D1PreparedStatementLike, D1RunResult, D1Value } from "./types.js";

type SqliteRunMeta = {
  changes?: number;
  last_row_id?: number;
};

class LocalD1PreparedStatement implements D1PreparedStatementLike {
  constructor(
    private readonly database: DatabaseSync,
    private readonly query: string,
    private readonly values: D1Value[] = []
  ) {}

  bind(...values: D1Value[]): D1PreparedStatementLike {
    return new LocalD1PreparedStatement(this.database, this.query, values);
  }

  async first<T = Record<string, unknown>>(columnName?: string): Promise<T | null> {
    const statement = this.database.prepare(this.query);
    const row = statement.get(...this.values) as Record<string, unknown> | undefined;
    if (!row) {
      return null;
    }

    if (columnName) {
      return (row[columnName] as T | undefined) ?? null;
    }

    return row as T;
  }

  async all<T = Record<string, unknown>>(): Promise<D1AllResult<T>> {
    const statement = this.database.prepare(this.query);
    return {
      results: statement.all(...this.values) as T[]
    };
  }

  async run(): Promise<D1RunResult> {
    const statement = this.database.prepare(this.query);
    const result = statement.run(...this.values) as {
      changes: number;
      lastInsertRowid?: number | bigint;
    };
    const lastInsertRowid =
      typeof result.lastInsertRowid === "bigint" ? Number(result.lastInsertRowid) : result.lastInsertRowid;

    return {
      success: true,
      meta: {
        changes: result.changes,
        last_row_id: lastInsertRowid
      } satisfies SqliteRunMeta
    };
  }
}

export class LocalD1Database implements D1DatabaseLike {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON;");
  }

  prepare(query: string): D1PreparedStatementLike {
    return new LocalD1PreparedStatement(this.database, query);
  }

  exec(query: string): void {
    this.database.exec(query);
  }

  close(): void {
    this.database.close();
  }
}

export async function applyHostedPriceStoreMigrations(
  database: LocalD1Database,
  migrationsDir: string
): Promise<string[]> {
  await mkdir(dirname(join(migrationsDir, ".keep")), { recursive: true });
  database.exec(`
    CREATE TABLE IF NOT EXISTS __price_store_migrations (
      migration_name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const entries = (await readdir(migrationsDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const applied: string[] = [];

  for (const entry of entries) {
    const existing = await database
      .prepare("SELECT migration_name FROM __price_store_migrations WHERE migration_name = ?1")
      .bind(entry)
      .first<string>("migration_name");
    if (existing) {
      continue;
    }

    database.exec(await readFile(join(migrationsDir, entry), "utf8"));
    await database
      .prepare("INSERT INTO __price_store_migrations (migration_name, applied_at) VALUES (?1, ?2)")
      .bind(entry, new Date().toISOString())
      .run();
    applied.push(entry);
  }

  return applied;
}
