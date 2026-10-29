import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { BuyerRegistrationRecord } from "../../src/modules/buyers/application/ports.js";
import { PostgresBuyerRegistrationStore } from "../../src/modules/buyers/infrastructure/postgres-buyer-registration-store.js";
import { PerfilComprador } from "../../src/modules/buyers/domain/perfil-comprador.js";
import { Carrito } from "../../src/modules/cart/domain/carrito.js";
import { Usuario } from "../../src/modules/identity/domain/usuario.js";
import { Argon2PasswordHasher } from "../../src/modules/identity/infrastructure/argon2-password-hasher.js";
import {
  auditId,
  carritoId,
  compradorId,
  eventId,
  usuarioId
} from "../../src/shared/domain/ids.js";
import {
  CorreoElectronico,
  DocumentoIdentidad,
  HashCredencial,
  Instant,
  NombreCompleto
} from "../../src/shared/domain/value-objects.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import {
  countRegistrationRows,
  deleteRegistrationRows,
  ensureTestSchema,
  requireTestDatabaseUrl,
  type RegistrationRowCounts,
  type RegistrationRowIds
} from "./support.js";

const PASSWORD = "correct horse battery staple";
const NOW = Instant.fromISOString("2026-10-28T12:00:00.000Z");
const ALL_ONES: RegistrationRowCounts = {
  users: 1,
  buyers: 1,
  carts: 1,
  auditLog: 1,
  outbox: 1
};
const ALL_ZEROS: RegistrationRowCounts = {
  users: 0,
  buyers: 0,
  carts: 0,
  auditLog: 0,
  outbox: 0
};

interface BuiltRegistration {
  readonly record: BuyerRegistrationRecord;
  readonly ids: RegistrationRowIds;
  readonly email: string;
}

const runId = randomUUID();
const created: RegistrationRowIds[] = [];
const hasher = new Argon2PasswordHasher();

let adminPool: Pool;
let app: FastifyInstance | undefined;
let store: PostgresBuyerRegistrationStore;
let credentialHash: string;
let sentinel: BuiltRegistration | undefined;

function buildRegistration(
  label: string,
  options: { readonly auditDetails?: Record<string, unknown> } = {}
): BuiltRegistration {
  const userUuid = randomUUID();
  const buyerUuid = randomUUID();
  const cartUuid = randomUUID();
  const correlationId = `corr-${label}-${runId}`;
  const email = `${label}-${runId}@example.com`;
  const documentNumber = `DOC-${label}-${runId}`;

  const nombre = NombreCompleto.create(`Cuenta ${label}`);
  const correo = CorreoElectronico.create(email);
  const documento = DocumentoIdentidad.create({
    tipo: "CC",
    pais: "CO",
    numero: documentNumber
  });
  const hash = HashCredencial.create(credentialHash);

  const usuario = Usuario.create({
    id: usuarioId(userUuid),
    nombreCompleto: nombre,
    correoElectronico: correo,
    documentoIdentidad: documento,
    credencial: hash,
    rol: "COMPRADOR",
    estado: "ACTIVO",
    creadoEn: NOW,
    actualizadoEn: NOW
  });
  const comprador = PerfilComprador.create({
    id: compradorId(buyerUuid),
    usuarioId: usuario.id,
    estadoComercial: "HABILITADO",
    direcciones: [],
    creadoEn: NOW
  });
  const carrito = Carrito.createEmpty({
    id: carritoId(cartUuid),
    compradorId: comprador.id,
    actualizadoEn: NOW
  });

  const record: BuyerRegistrationRecord = {
    usuario,
    comprador,
    carrito,
    auditoria: {
      id: auditId(randomUUID()),
      evento: "buyer.registered.v1",
      recursoTipo: "PerfilComprador",
      recursoId: comprador.id,
      actorId: "system:test",
      ocurridoEn: NOW,
      correlationId,
      resultado: "EXITO",
      gravedad: "INFORMACION",
      detalles: options.auditDetails ?? { usuarioId: usuario.id }
    },
    evento: {
      id: eventId(randomUUID()),
      tipo: "buyer.registered",
      versionEsquema: 1,
      agregadoTipo: "PerfilComprador",
      agregadoId: comprador.id,
      ocurridoEn: NOW,
      correlationId,
      payload: { usuarioId: usuario.id }
    }
  };

  return {
    record,
    email: correo.value,
    ids: {
      usuarioId: usuario.id,
      compradorId: comprador.id,
      carritoId: carrito.id,
      correlationId
    }
  };
}

function requestPayload(label: string, overrides: Record<string, unknown> = {}) {
  return {
    nombreCompleto: `Comprador ${label}`,
    correoElectronico: `race-${runId}@example.com`,
    documentoIdentidad: {
      tipo: "CC",
      pais: "CO",
      numero: `RACE-${label}-${runId}`
    },
    credencial: PASSWORD,
    ...overrides
  };
}

describe("PI-01 contra PostgreSQL real", () => {
  beforeAll(async () => {
    const databaseUrl = requireTestDatabaseUrl();
    adminPool = new Pool({ connectionString: databaseUrl, max: 2 });
    await ensureTestSchema(adminPool);

    credentialHash = await hasher.hash(PASSWORD);
    store = new PostgresBuyerRegistrationStore(databaseUrl);
    app = await buildApp(
      loadConfig({
        NODE_ENV: "test",
        HOST: "127.0.0.1",
        PORT: "3000",
        PERSISTENCE: "postgres",
        DATABASE_URL: databaseUrl,
        LOG_LEVEL: "silent"
      }),
      {
        store,
        hasher,
        clock: new FixedClock(),
        ids: new SequentialIds()
      }
    );

    sentinel = buildRegistration("sentinel");
    await store.saveRegistration(sentinel.record);
  });

  afterAll(async () => {
    if (!adminPool) {
      return;
    }
    if (!sentinel) {
      await app?.close();
      await adminPool.end();
      return;
    }

    const sentinelBefore = await countRegistrationRows(adminPool, sentinel.ids);
    let sentinelAfter: RegistrationRowCounts | undefined;
    let residual: RegistrationRowCounts[] | undefined;

    try {
      await deleteRegistrationRows(adminPool, created);
      sentinelAfter = await countRegistrationRows(adminPool, sentinel.ids);
      residual = await Promise.all(
        created.map((ids) => countRegistrationRows(adminPool, ids))
      );
    } finally {
      await deleteRegistrationRows(adminPool, [sentinel.ids]);
      await app?.close();
      await adminPool.end();
    }

    expect(sentinelBefore).toEqual(ALL_ONES);
    expect(sentinelAfter).toEqual(ALL_ONES);
    for (const counts of residual ?? []) {
      expect(counts).toEqual(ALL_ZEROS);
    }
  });

  it("resuelve dos altas concurrentes con un 201 y un 409, sin duplicar filas", async () => {
    const responses = await Promise.all([
      app!.inject({
        method: "POST",
        url: "/api/v1/buyers",
        headers: { "x-correlation-id": `race-a-${runId}` },
        payload: requestPayload("A")
      }),
      app!.inject({
        method: "POST",
        url: "/api/v1/buyers",
        headers: { "x-correlation-id": `race-b-${runId}` },
        payload: requestPayload("B")
      })
    ]);

    const statuses = responses.map((response) => response.statusCode).sort();
    expect(statuses).toEqual([201, 409]);

    const winner = responses.find((response) => response.statusCode === 201);
    const loser = responses.find((response) => response.statusCode === 409);
    expect(winner).toBeDefined();
    expect(loser).toBeDefined();

    const data = winner!.json().data;
    const winnerIds: RegistrationRowIds = {
      usuarioId: data.usuarioId,
      compradorId: data.compradorId,
      carritoId: data.carritoId,
      correlationId: String(winner!.headers["x-correlation-id"])
    };
    created.push(winnerIds);

    expect(loser!.json()).toMatchObject({
      error: {
        codigo: "CONFLICTO_UNICIDAD",
        correlationId: loser!.headers["x-correlation-id"]
      }
    });

    await expect(countRegistrationRows(adminPool, winnerIds)).resolves.toEqual(
      ALL_ONES
    );
    const emailCount = await adminPool.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM users WHERE correo_normalizado = $1",
      [`race-${runId}@example.com`]
    );
    expect(emailCount.rows[0]?.count).toBe(1);
  });

  it("revierte la transacción si falla una escritura posterior al alta de usuario", async () => {
    // El check `audit_log_no_secretos` falla después de insertar users, buyers
    // y carts. La prueba demuestra que el ROLLBACK no deja registros parciales.
    const failed = buildRegistration("rollback", {
      auditDetails: { password: "no-debe-persistirse" }
    });
    created.push(failed.ids);

    await expect(store.saveRegistration(failed.record)).rejects.toMatchObject({
      code: "DEPENDENCIA_NO_DISPONIBLE"
    });

    await expect(countRegistrationRows(adminPool, failed.ids)).resolves.toEqual(
      ALL_ZEROS
    );
    const emailCount = await adminPool.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM users WHERE correo_normalizado = $1",
      [failed.email]
    );
    expect(emailCount.rows[0]?.count).toBe(0);
  });

  it("bloquea secretos anidados y claves alternativas en auditoría", async () => {
    const cases: Array<{ label: string; details: Record<string, unknown> }> = [
      { label: "nested-password", details: { contexto: { password: "secreto" } } },
      {
        label: "nested-credential",
        details: { pila: [{ "hash_credencial": "hash" }] }
      },
      {
        label: "alternative-token",
        details: { metadata: { "Access-Token": "token" } }
      }
    ];

    for (const testCase of cases) {
      const failed = buildRegistration(testCase.label, {
        auditDetails: testCase.details
      });
      created.push(failed.ids);

      await expect(store.saveRegistration(failed.record)).rejects.toMatchObject({
        code: "DEPENDENCIA_NO_DISPONIBLE"
      });
      await expect(countRegistrationRows(adminPool, failed.ids)).resolves.toEqual(
        ALL_ZEROS
      );
    }
  });
});
