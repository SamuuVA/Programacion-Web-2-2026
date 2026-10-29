import "dotenv/config";
import type { Pool } from "pg";
import { runMigrations } from "../../src/infrastructure/migrations.js";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export interface RegistrationRowIds {
  readonly usuarioId: string;
  readonly compradorId: string;
  readonly carritoId: string;
  readonly correlationId: string;
}

export interface RegistrationRowCounts {
  readonly users: number;
  readonly buyers: number;
  readonly carts: number;
  readonly auditLog: number;
  readonly outbox: number;
}

/**
 * Devuelve la URL de la base de prueba o falla de forma explícita.
 *
 * La suite nunca se omite en silencio: si PostgreSQL no está configurado, la
 * ejecución de `npm run test:postgres` falla y el gate queda `BLOCKED`.
 */
export function requireTestDatabaseUrl(): string {
  const raw = process.env.TEST_DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "TEST_DATABASE_URL es obligatoria para ejecutar la suite PostgreSQL."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("TEST_DATABASE_URL no es una URL válida.");
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("TEST_DATABASE_URL debe usar el protocolo postgresql://.");
  }

  if (parsed.searchParams.size > 0) {
    throw new Error(
      "TEST_DATABASE_URL no debe incluir parámetros de consulta que puedan cambiar el host o la base validados."
    );
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new Error(
      "TEST_DATABASE_URL debe apuntar a un host local (127.0.0.1, localhost o ::1)."
    );
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (database.length === 0 || !database.endsWith("_test")) {
    throw new Error(
      "TEST_DATABASE_URL debe apuntar a una base dedicada cuyo nombre termine en `_test`."
    );
  }

  return raw;
}

/**
 * Aplica las migraciones versionadas a la base de prueba.
 *
 * `allowBaseline` solo cubre una base de prueba ya identificada por
 * `requireTestDatabaseUrl()`. Si el esquema está parcial, el runner falla y no
 * intenta repararlo a ciegas.
 */
export async function ensureTestSchema(pool: Pool): Promise<void> {
  await runMigrations({ pool, allowBaseline: true });

  const after = await tablePresence(pool);
  if (!after.every(Boolean)) {
    throw new Error("Las migraciones de prueba no crearon todas las tablas requeridas.");
  }
}

export async function countRegistrationRows(
  pool: Pool,
  ids: RegistrationRowIds
): Promise<RegistrationRowCounts> {
  const result = await pool.query<RegistrationRowCounts>(
    `SELECT
       (SELECT COUNT(*)::int FROM users WHERE id = $1::uuid) AS users,
       (SELECT COUNT(*)::int FROM buyers WHERE id = $2::uuid) AS buyers,
       (SELECT COUNT(*)::int FROM carts WHERE id = $3::uuid) AS carts,
       (SELECT COUNT(*)::int FROM audit_log WHERE correlation_id = $4) AS "auditLog",
       (SELECT COUNT(*)::int FROM outbox WHERE correlation_id = $4) AS outbox`,
    [ids.usuarioId, ids.compradorId, ids.carritoId, ids.correlationId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("La consulta de conteo no devolvió filas.");
  }
  return row;
}

/**
 * Limpieza dirigida por identificadores y correlación de esta ejecución.
 * No usa TRUNCATE ni elimina registros ajenos a la prueba.
 */
export async function deleteRegistrationRows(
  pool: Pool,
  records: readonly RegistrationRowIds[]
): Promise<void> {
  if (records.length === 0) {
    return;
  }

  const usuarioIds = unique(records.map((record) => record.usuarioId));
  const compradorIds = unique(records.map((record) => record.compradorId));
  const carritoIds = unique(records.map((record) => record.carritoId));
  const correlationIds = unique(records.map((record) => record.correlationId));

  await pool.query("DELETE FROM outbox WHERE correlation_id = ANY($1::text[])", [
    correlationIds
  ]);
  await pool.query("DELETE FROM audit_log WHERE correlation_id = ANY($1::text[])", [
    correlationIds
  ]);
  await pool.query("DELETE FROM carts WHERE id = ANY($1::uuid[])", [carritoIds]);
  await pool.query("DELETE FROM buyers WHERE id = ANY($1::uuid[])", [compradorIds]);
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [usuarioIds]);
}

async function tablePresence(pool: Pool): Promise<boolean[]> {
  const result = await pool.query<{
    users: string | null;
    buyers: string | null;
    carts: string | null;
    auditLog: string | null;
    outbox: string | null;
  }>(
    `SELECT
       to_regclass('public.users')::text AS users,
       to_regclass('public.buyers')::text AS buyers,
       to_regclass('public.carts')::text AS carts,
       to_regclass('public.audit_log')::text AS "auditLog",
       to_regclass('public.outbox')::text AS outbox`
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("No fue posible comprobar el esquema de prueba.");
  }
  return [
    row.users !== null,
    row.buyers !== null,
    row.carts !== null,
    row.auditLog !== null,
    row.outbox !== null
  ];
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
