import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";

const MIGRATION_FILE_PATTERN = /^(\d{3})_([a-z0-9][a-z0-9_-]*)\.sql$/;
const HISTORY_TABLE = "schema_migrations";
const LOCK_KEY = "nexusmarket_schema_migrations";

export interface Migration {
  readonly version: string;
  readonly name: string;
  readonly filename: string;
  readonly checksum: string;
  readonly sql: string;
}

export interface AppliedMigration {
  readonly version: string;
  readonly name: string;
  readonly checksum: string;
  readonly appliedAt: string;
}

export interface MigrationStatus {
  readonly applied: readonly AppliedMigration[];
  readonly pending: readonly Migration[];
}

export interface MigrationResult {
  readonly applied: readonly string[];
  readonly baselined: readonly string[];
  readonly skipped: readonly string[];
}

export interface RunMigrationsOptions {
  readonly connectionString?: string;
  readonly pool?: Pool;
  readonly migrationsDir?: string;
  /**
   * Solo debe usarse con una base existente ya verificada. Registra `001` como
   * aplicada si las tablas iniciales existen y aún no hay historial.
   */
  readonly allowBaseline?: boolean;
  /**
   * Esquema alternativo para pruebas aisladas. En uso normal no se define.
   */
  readonly schema?: string;
}

export function defaultMigrationsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "migrations");
}

export async function discoverMigrations(
  migrationsDir = defaultMigrationsDir()
): Promise<Migration[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && MIGRATION_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const migrations = await Promise.all(
    files.map(async (filename) => {
      const match = MIGRATION_FILE_PATTERN.exec(filename);
      if (!match) {
        throw new Error(`Nombre de migración inválido: ${filename}`);
      }
      const sql = await readFile(resolve(migrationsDir, filename), "utf8");
      return {
        version: match[1]!,
        name: match[2]!,
        filename,
        checksum: checksum(sql),
        sql
      };
    })
  );

  const versions = new Set<string>();
  for (const migration of migrations) {
    if (versions.has(migration.version)) {
      throw new Error(`Hay más de una migración con la versión ${migration.version}.`);
    }
    versions.add(migration.version);
  }

  return migrations;
}

export async function getMigrationStatus(
  options: RunMigrationsOptions = {}
): Promise<MigrationStatus> {
  return withClient(options, async (client) => {
    await setSearchPath(client, options.schema);
    try {
      const migrations = await discoverMigrations(options.migrationsDir);
      const table = await historyTableExists(client, options.schema);
      if (!table) {
        return { applied: [], pending: migrations };
      }
      const applied = await readApplied(client);
      validateAppliedHistory(applied, migrations);
      return {
        applied,
        pending: migrations.filter(
          (migration) => !applied.some((row) => row.version === migration.version)
        )
      };
    } finally {
      await resetSearchPath(client, options.schema);
    }
  });
}

export async function runMigrations(
  options: RunMigrationsOptions = {}
): Promise<MigrationResult> {
  return withClient(options, async (client) => {
    await setSearchPath(client, options.schema);
    const migrations = await discoverMigrations(options.migrationsDir);
    await client.query("SELECT pg_advisory_lock(hashtext($1)::bigint)", [LOCK_KEY]);

    const baselined: string[] = [];
    const applied: string[] = [];
    const skipped: string[] = [];

    try {
      await ensureHistoryTable(client, options.schema);
      const appliedRows = await readApplied(client);
      validateAppliedHistory(appliedRows, migrations);

      if (appliedRows.length === 0 && (await initialTablesExist(client))) {
        if (!options.allowBaseline) {
          throw new Error(
            "La base ya contiene el esquema inicial pero no tiene historial de migraciones. " +
              "Ejecuta `npm run db:migrate:baseline` tras verificar que la base es la correcta."
          );
        }
        const first = migrations[0];
        if (!first) {
          throw new Error("No hay migraciones para registrar como línea base.");
        }
        await insertHistory(client, first);
        baselined.push(first.version);
        appliedRows.push({
          version: first.version,
          name: first.name,
          checksum: first.checksum,
          appliedAt: new Date().toISOString()
        });
      }

      for (const migration of migrations) {
        if (appliedRows.some((row) => row.version === migration.version)) {
          skipped.push(migration.version);
          continue;
        }

        await client.query("BEGIN");
        try {
          await client.query(migration.sql);
          await insertHistory(client, migration);
          await client.query("COMMIT");
          applied.push(migration.version);
        } catch (error) {
          await rollback(client);
          throw new Error(
            `La migración ${migration.filename} falló y fue revertida: ${messageOf(error)}`
          );
        }
      }
    } finally {
      await client.query("SELECT pg_advisory_unlock(hashtext($1)::bigint)", [LOCK_KEY]);
      await resetSearchPath(client, options.schema);
    }

    return { applied, baselined, skipped };
  });
}

async function withClient<T>(
  options: RunMigrationsOptions,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (options.pool) {
    const client = await options.pool.connect();
    try {
      return await operation(client);
    } finally {
      client.release();
    }
  }

  if (!options.connectionString) {
    throw new Error("Se requiere connectionString o pool para ejecutar migraciones.");
  }

  const pool = new Pool({ connectionString: options.connectionString });
  try {
    const client = await pool.connect();
    try {
      return await operation(client);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

async function ensureHistoryTable(client: PoolClient, schema?: string): Promise<void> {
  const qualified = qualify(schema, HISTORY_TABLE);
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${qualified} (
       version text PRIMARY KEY,
       name text NOT NULL,
       checksum text NOT NULL,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`
  );
}

async function historyTableExists(client: PoolClient, schema?: string): Promise<boolean> {
  const qualified = qualify(schema, HISTORY_TABLE);
  const result = await client.query<{ exists: boolean }>(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [qualified]
  );
  return result.rows[0]?.exists === true;
}

async function readApplied(client: PoolClient): Promise<AppliedMigration[]> {
  const result = await client.query<{
    version: string;
    name: string;
    checksum: string;
    applied_at: Date;
  }>(`SELECT version, name, checksum, applied_at FROM ${HISTORY_TABLE} ORDER BY version`);

  return result.rows.map((row) => ({
    version: row.version,
    name: row.name,
    checksum: row.checksum,
    appliedAt: row.applied_at.toISOString()
  }));
}

async function insertHistory(client: PoolClient, migration: Migration): Promise<void> {
  await client.query(
    `INSERT INTO ${HISTORY_TABLE} (version, name, checksum) VALUES ($1, $2, $3)`,
    [migration.version, migration.name, migration.checksum]
  );
}

function validateAppliedHistory(
  applied: readonly AppliedMigration[],
  migrations: readonly Migration[]
): void {
  for (const row of applied) {
    const migration = migrations.find((candidate) => candidate.version === row.version);
    if (!migration) {
      throw new Error(
        `El historial contiene la versión ${row.version}, pero no existe su archivo de migración.`
      );
    }
    if (migration.checksum !== row.checksum) {
      throw new Error(
        `La migración ${migration.filename} cambió después de aplicarse. ` +
          "Crea una migración nueva en vez de editar una ya aplicada."
      );
    }
  }
}

async function initialTablesExist(client: PoolClient): Promise<boolean> {
  const result = await client.query<{
    users: string | null;
    buyers: string | null;
    carts: string | null;
    auditLog: string | null;
    outbox: string | null;
  }>(
    `SELECT
       to_regclass('users')::text AS users,
       to_regclass('buyers')::text AS buyers,
       to_regclass('carts')::text AS carts,
       to_regclass('audit_log')::text AS "auditLog",
       to_regclass('outbox')::text AS outbox`
  );
  const row = result.rows[0];
  return Boolean(
    row && row.users && row.buyers && row.carts && row.auditLog && row.outbox
  );
}

async function setSearchPath(client: PoolClient, schema?: string): Promise<void> {
  if (!schema) {
    return;
  }
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) {
    throw new Error(`Esquema inválido: ${schema}`);
  }
  await client.query(`SET search_path TO ${quoteIdentifier(schema)}, pg_catalog`);
}

async function resetSearchPath(client: PoolClient, schema?: string): Promise<void> {
  if (!schema) {
    return;
  }
  await client.query("SET search_path TO DEFAULT");
}

function qualify(schema: string | undefined, table: string): string {
  return schema ? `${quoteIdentifier(schema)}.${quoteIdentifier(table)}` : quoteIdentifier(table);
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Se informa el error original.
  }
}

function checksum(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "error desconocido";
}
