import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getMigrationStatus,
  runMigrations
} from "../../src/infrastructure/migrations.js";
import { requireTestDatabaseUrl } from "./support.js";

const schema = `migration_test_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

let pool: Pool;

describe("Migraciones versionadas contra PostgreSQL real", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: requireTestDatabaseUrl(), max: 2 });
    await pool.query(`CREATE SCHEMA "${schema}"`);
  });

  afterAll(async () => {
    if (pool) {
      await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await pool.end();
    }
  });

  it("crea el esquema desde cero, registra historial y es idempotente", async () => {
    const first = await runMigrations({ pool, schema });
    expect(first.applied).toEqual(["001", "002"]);
    expect(first.baselined).toEqual([]);

    const second = await runMigrations({ pool, schema });
    expect(second.applied).toEqual([]);
    expect(second.skipped).toEqual(["001", "002"]);

    const status = await getMigrationStatus({ pool, schema });
    expect(status.applied.map((migration) => migration.version)).toEqual([
      "001",
      "002"
    ]);
    expect(status.pending).toHaveLength(0);

    const tables = await pool.query<{ table_name: string }>(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name`,
      [schema]
    );
    expect(tables.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        "audit_log",
        "buyers",
        "carts",
        "outbox",
        "schema_migrations",
        "users"
      ])
    );
  });

  it("detecta una migración aplicada cuyo archivo cambió", async () => {
    await pool.query(
      `UPDATE "${schema}".schema_migrations
          SET checksum = 'checksum-manipulado'
        WHERE version = '001'`
    );

    await expect(getMigrationStatus({ pool, schema })).rejects.toThrow(
      /cambió después de aplicarse/
    );
  });
});
