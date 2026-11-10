import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresSellerApplicationStore } from "../../src/modules/seller-applications/infrastructure/postgres-seller-application-store.js";
import { PostgresUserAccessStore } from "../../src/modules/identity/infrastructure/postgres-user-access-store.js";
import type {
  ApproveSellerApplicationInput,
  CreateSellerApplicationRecord,
  RejectSellerApplicationInput
} from "../../src/modules/seller-applications/application/ports.js";
import { UniquenessConflictError } from "../../src/shared/domain/errors.js";
import { auditId, eventId } from "../../src/shared/domain/ids.js";
import { Instant } from "../../src/shared/domain/value-objects.js";
import { ensureTestSchema, requireTestDatabaseUrl } from "./support.js";

const NOW = Instant.fromISOString("2026-11-08T12:00:00.000Z");
const runId = randomUUID();

let pool: Pool;
let applications: PostgresSellerApplicationStore;
let access: PostgresUserAccessStore;
const createdUserIds: string[] = [];
const correlationIds: string[] = [];

interface SeededUser {
  readonly usuarioId: string;
  readonly correo: string;
}

async function insertUser(
  label: string,
  rol: "COMPRADOR" | "ADMINISTRADOR" = "COMPRADOR"
): Promise<SeededUser> {
  const usuarioId = randomUUID();
  const correo = `${label}-${runId}@example.com`;
  await pool.query(
    `INSERT INTO users (
       id, nombre_completo, correo_normalizado, documento_tipo, documento_pais,
       documento_numero, hash_credencial, rol, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CC', 'CO', $4, $5, $6, 'ACTIVO', $7, $7)`,
    [
      usuarioId,
      `Cuenta ${label}`,
      correo,
      `DOC-${label}-${runId}`,
      "hash-de-prueba",
      rol,
      NOW.value
    ]
  );
  createdUserIds.push(usuarioId);
  return { usuarioId, correo };
}

function buildApplication(
  usuarioId: string,
  label: string
): CreateSellerApplicationRecord {
  const id = randomUUID();
  const correlationId = `sa-${label}-${runId}`;
  correlationIds.push(correlationId);
  return {
    id,
    usuarioId,
    nombreComercial: `Comercio ${label}`,
    nombreBodega: `Bodega ${label}`,
    ubicacionBodega: "Bogotá, Colombia",
    creadaEn: NOW.value,
    actualizadaEn: NOW.value,
    auditoria: {
      id: auditId(randomUUID()),
      evento: "seller-application.submitted.v1",
      recursoTipo: "SolicitudVendedor",
      recursoId: id,
      actorId: usuarioId,
      rolActor: "COMPRADOR",
      ocurridoEn: NOW,
      correlationId,
      resultado: "EXITO",
      gravedad: "INFORMACION",
      detalles: { usuarioId }
    },
    evento: {
      id: eventId(randomUUID()),
      tipo: "seller.application.submitted",
      versionEsquema: 1,
      agregadoTipo: "SolicitudVendedor",
      agregadoId: id,
      ocurridoEn: NOW,
      correlationId,
      payload: { solicitudId: id, usuarioId }
    }
  };
}

function approveInput(
  applicationId: string,
  actorId: string,
  label: string
): ApproveSellerApplicationInput {
  const correlationId = `sa-approve-${label}-${runId}`;
  correlationIds.push(correlationId);
  return {
    applicationId,
    actorId,
    actorRol: "ADMINISTRADOR",
    revisadoEn: NOW.value,
    sellerId: randomUUID(),
    warehouseId: randomUUID(),
    auditoria: {
      id: auditId(randomUUID()),
      evento: "seller-application.approved.v1",
      recursoTipo: "SolicitudVendedor",
      recursoId: applicationId,
      actorId,
      rolActor: "ADMINISTRADOR",
      ocurridoEn: NOW,
      correlationId,
      resultado: "EXITO",
      gravedad: "INFORMACION",
      detalles: {}
    },
    evento: {
      id: eventId(randomUUID()),
      tipo: "seller.application.approved",
      versionEsquema: 1,
      agregadoTipo: "SolicitudVendedor",
      agregadoId: applicationId,
      ocurridoEn: NOW,
      correlationId,
      payload: {}
    }
  };
}

function rejectInput(
  applicationId: string,
  actorId: string,
  label: string
): RejectSellerApplicationInput {
  const correlationId = `sa-reject-${label}-${runId}`;
  correlationIds.push(correlationId);
  return {
    applicationId,
    actorId,
    actorRol: "ADMINISTRADOR",
    motivo: "Información comercial incompleta",
    revisadoEn: NOW.value,
    auditoria: {
      id: auditId(randomUUID()),
      evento: "seller-application.rejected.v1",
      recursoTipo: "SolicitudVendedor",
      recursoId: applicationId,
      actorId,
      rolActor: "ADMINISTRADOR",
      ocurridoEn: NOW,
      correlationId,
      resultado: "EXITO",
      gravedad: "INFORMACION",
      detalles: {}
    },
    evento: {
      id: eventId(randomUUID()),
      tipo: "seller.application.rejected",
      versionEsquema: 1,
      agregadoTipo: "SolicitudVendedor",
      agregadoId: applicationId,
      ocurridoEn: NOW,
      correlationId,
      payload: {}
    }
  };
}

async function countSellerRows(usuarioId: string) {
  const result = await pool.query<{ sellers: number; warehouses: number }>(
    `SELECT
       (SELECT COUNT(*)::int FROM sellers WHERE usuario_id = $1::uuid) AS sellers,
       (SELECT COUNT(*)::int
          FROM warehouses w
          JOIN sellers s ON s.id = w.vendedor_id
         WHERE s.usuario_id = $1::uuid) AS warehouses`,
    [usuarioId]
  );
  return result.rows[0];
}

describe("Solicitudes de vendedor y acceso contra PostgreSQL real", () => {
  beforeAll(async () => {
    const databaseUrl = requireTestDatabaseUrl();
    pool = new Pool({ connectionString: databaseUrl, max: 4 });
    await ensureTestSchema(pool);
    applications = new PostgresSellerApplicationStore(databaseUrl);
    access = new PostgresUserAccessStore(databaseUrl);
  });

  afterAll(async () => {
    if (!pool) {
      return;
    }
    try {
      if (createdUserIds.length > 0) {
        await pool.query(
          "DELETE FROM sessions WHERE usuario_id = ANY($1::uuid[])",
          [createdUserIds]
        );
        await pool.query(
          "DELETE FROM seller_applications WHERE usuario_id = ANY($1::uuid[])",
          [createdUserIds]
        );
        await pool.query(
          `DELETE FROM warehouses
            WHERE vendedor_id IN (
              SELECT id FROM sellers WHERE usuario_id = ANY($1::uuid[])
            )`,
          [createdUserIds]
        );
        await pool.query(
          "DELETE FROM sellers WHERE usuario_id = ANY($1::uuid[])",
          [createdUserIds]
        );
      }
      if (correlationIds.length > 0) {
        await pool.query(
          "DELETE FROM outbox WHERE correlation_id = ANY($1::text[])",
          [correlationIds]
        );
        await pool.query(
          "DELETE FROM audit_log WHERE correlation_id = ANY($1::text[])",
          [correlationIds]
        );
      }
      if (createdUserIds.length > 0) {
        await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
          createdUserIds
        ]);
      }
    } finally {
      await applications?.close();
      await access?.close();
      await pool.end();
    }
  });

  it("crea una solicitud PENDIENTE y bloquea una segunda pendiente del mismo usuario", async () => {
    const buyer = await insertUser("pending");
    const record = buildApplication(buyer.usuarioId, "pending");

    const saved = await applications.create(record);
    expect(saved).toMatchObject({
      id: record.id,
      usuarioId: buyer.usuarioId,
      estado: "PENDIENTE",
      usuarioRol: "COMPRADOR",
      sellerId: null,
      warehouseId: null
    });

    await expect(
      applications.create(buildApplication(buyer.usuarioId, "pending-2"))
    ).rejects.toBeInstanceOf(UniquenessConflictError);

    const count = await pool.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM seller_applications WHERE usuario_id = $1",
      [buyer.usuarioId]
    );
    expect(count.rows[0]?.total).toBe(1);
  });

  it("aprueba en una transacción creando vendedor y primera bodega, y reintenta sin duplicar", async () => {
    const buyer = await insertUser("approve");
    const admin = await insertUser("approve-admin", "ADMINISTRADOR");
    const record = buildApplication(buyer.usuarioId, "approve");
    await applications.create(record);

    const first = await applications.approve(
      approveInput(record.id, admin.usuarioId, "first")
    );
    expect(first.yaAprobada).toBe(false);
    expect(first.solicitud.estado).toBe("APROBADA");
    expect(first.solicitud.usuarioRol).toBe("VENDEDOR");

    const user = await pool.query<{ rol: string }>(
      "SELECT rol FROM users WHERE id = $1",
      [buyer.usuarioId]
    );
    expect(user.rows[0]?.rol).toBe("VENDEDOR");
    await expect(countSellerRows(buyer.usuarioId)).resolves.toEqual({
      sellers: 1,
      warehouses: 1
    });

    const retry = await applications.approve(
      approveInput(record.id, admin.usuarioId, "retry")
    );
    expect(retry.yaAprobada).toBe(true);
    expect(retry.sellerId).toBe(first.sellerId);
    expect(retry.warehouseId).toBe(first.warehouseId);
    await expect(countSellerRows(buyer.usuarioId)).resolves.toEqual({
      sellers: 1,
      warehouses: 1
    });
  });

  it("rechaza sin crear vendedor ni bodega y conserva el acceso del comprador", async () => {
    const buyer = await insertUser("reject");
    const admin = await insertUser("reject-admin", "ADMINISTRADOR");
    const record = buildApplication(buyer.usuarioId, "reject");
    await applications.create(record);

    const rejected = await applications.reject(
      rejectInput(record.id, admin.usuarioId, "reject")
    );
    expect(rejected).toMatchObject({
      estado: "RECHAZADA",
      motivoRechazo: "Información comercial incompleta",
      sellerId: null,
      warehouseId: null,
      usuarioRol: "COMPRADOR",
      usuarioEstado: "ACTIVO"
    });
    await expect(countSellerRows(buyer.usuarioId)).resolves.toEqual({
      sellers: 0,
      warehouses: 0
    });
  });

  it("revierte la aprobación completa si una escritura posterior falla", async () => {
    const buyer = await insertUser("rollback");
    const admin = await insertUser("rollback-admin", "ADMINISTRADOR");
    const record = buildApplication(buyer.usuarioId, "rollback");
    await applications.create(record);

    const input = approveInput(record.id, admin.usuarioId, "rollback");
    const failing: ApproveSellerApplicationInput = {
      ...input,
      auditoria: {
        ...input.auditoria,
        detalles: { password: "no-debe-persistirse" }
      }
    };

    await expect(applications.approve(failing)).rejects.toMatchObject({
      code: "DEPENDENCIA_NO_DISPONIBLE"
    });

    const user = await pool.query<{ rol: string }>(
      "SELECT rol FROM users WHERE id = $1",
      [buyer.usuarioId]
    );
    expect(user.rows[0]?.rol).toBe("COMPRADOR");
    await expect(countSellerRows(buyer.usuarioId)).resolves.toEqual({
      sellers: 0,
      warehouses: 0
    });
    const application = await applications.findById(record.id);
    expect(application?.estado).toBe("PENDIENTE");
  });

  it("cambia el estado de acceso y revoca las sesiones en la misma transacción", async () => {
    const buyer = await insertUser("access");
    const admin = await insertUser("access-admin", "ADMINISTRADOR");
    const sessionId = randomUUID();
    await pool.query(
      `INSERT INTO sessions (
         id, usuario_id, token_hash, creada_en, expira_en, ultima_actividad_en,
         correlation_id
       ) VALUES ($1, $2, $3, $4, $5, $4, $6)`,
      [
        sessionId,
        buyer.usuarioId,
        `token-${runId}-${sessionId}`,
        NOW.value,
        "2026-11-09T12:00:00.000Z",
        `session-${runId}`
      ]
    );

    const auditIdValue = auditId(randomUUID());
    const correlationId = `access-${runId}`;
    correlationIds.push(correlationId);

    const result = await access.applyTransition({
      usuarioId: buyer.usuarioId,
      estadoEsperado: "ACTIVO",
      estadoNuevo: "INACTIVO",
      accion: "DESACTIVAR",
      motivo: "Solicitud del titular",
      actorId: admin.usuarioId,
      actorRol: "ADMINISTRADOR",
      correlationId,
      ocurridoEn: NOW.value,
      auditId: auditIdValue,
      revocarSesiones: true
    });

    expect(result).toMatchObject({
      estadoAnterior: "ACTIVO",
      estadoNuevo: "INACTIVO",
      sesionesRevocadas: 1
    });

    const user = await pool.query<{ estado: string }>(
      "SELECT estado FROM users WHERE id = $1",
      [buyer.usuarioId]
    );
    expect(user.rows[0]?.estado).toBe("INACTIVO");
    const session = await pool.query<{ revocada_en: Date | null }>(
      "SELECT revocada_en FROM sessions WHERE id = $1",
      [sessionId]
    );
    expect(session.rows[0]?.revocada_en).not.toBeNull();
  });

  it("rechaza una transición cuando el estado cambió desde la lectura", async () => {
    const buyer = await insertUser("stale");
    const admin = await insertUser("stale-admin", "ADMINISTRADOR");

    await expect(
      access.applyTransition({
        usuarioId: buyer.usuarioId,
        estadoEsperado: "BLOQUEADO",
        estadoNuevo: "INACTIVO",
        accion: "DESACTIVAR",
        motivo: "Estado obsoleto",
        actorId: admin.usuarioId,
        actorRol: "ADMINISTRADOR",
        correlationId: `stale-${runId}`,
        ocurridoEn: NOW.value,
        auditId: auditId(randomUUID()),
        revocarSesiones: true
      })
    ).rejects.toMatchObject({ code: "REGLA_NEGOCIO_INCUMPLIDA" });
  });
});
