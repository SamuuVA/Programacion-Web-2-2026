import { Pool, type PoolClient } from "pg";
import {
  BusinessRuleError,
  DependencyUnavailableError,
  ResourceNotFoundError,
  UniquenessConflictError
} from "../../../shared/domain/errors.js";
import type {
  EventoDominio,
  RegistroAuditoria
} from "../../../shared/domain/audit.js";
import type {
  EstadoUsuario,
  RolSistema
} from "../../identity/domain/usuario.js";
import type { EstadoSolicitudVendedor } from "../domain/solicitud-vendedor.js";
import type {
  ApproveSellerApplicationInput,
  ApproveSellerApplicationResult,
  CreateSellerApplicationRecord,
  RejectSellerApplicationInput,
  SellerApplicationDetail,
  SellerApplicationFilter,
  SellerApplicationPage,
  SellerApplicationStore,
  SellerApplicationSummary
} from "../application/ports.js";

interface ApplicationRow {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  correo_normalizado: string;
  usuario_rol: RolSistema;
  usuario_estado: EstadoUsuario;
  nombre_comercial: string;
  nombre_bodega: string;
  ubicacion_bodega: string;
  estado: EstadoSolicitudVendedor;
  motivo_rechazo: string | null;
  revisado_por: string | null;
  revisado_en: Date | null;
  creada_en: Date;
  actualizada_en: Date;
  seller_id: string | null;
  warehouse_id: string | null;
}

type SummaryRow = Omit<
  ApplicationRow,
  | "ubicacion_bodega"
  | "motivo_rechazo"
  | "revisado_por"
  | "revisado_en"
  | "seller_id"
  | "warehouse_id"
  | "usuario_rol"
  | "usuario_estado"
>;

interface CountRow {
  total: number;
}

interface LockedApplicationRow {
  id: string;
  usuario_id: string;
  estado: EstadoSolicitudVendedor;
  nombre_comercial: string;
  nombre_bodega: string;
  ubicacion_bodega: string;
}

const APPLICATION_SELECT = `
  SELECT sa.id,
         sa.usuario_id,
         u.nombre_completo,
         u.correo_normalizado,
         u.rol AS usuario_rol,
         u.estado AS usuario_estado,
         sa.nombre_comercial,
         sa.nombre_bodega,
         sa.ubicacion_bodega,
         sa.estado,
         sa.motivo_rechazo,
         sa.revisado_por,
         sa.revisado_en,
         sa.creada_en,
         sa.actualizada_en,
         s.id AS seller_id,
         w.id AS warehouse_id
    FROM seller_applications sa
    JOIN users u ON u.id = sa.usuario_id
    LEFT JOIN sellers s ON s.usuario_id = sa.usuario_id
    LEFT JOIN warehouses w
      ON w.vendedor_id = s.id AND w.tipo = 'VENDEDOR'
`;

const SUMMARY_SELECT = `
  SELECT sa.id,
         sa.usuario_id,
         u.nombre_completo,
         u.correo_normalizado,
         u.rol AS usuario_rol,
         u.estado AS usuario_estado,
         sa.nombre_comercial,
         sa.nombre_bodega,
         sa.estado,
         sa.creada_en,
         sa.actualizada_en
    FROM seller_applications sa
    JOIN users u ON u.id = sa.usuario_id
`;

export class PostgresSellerApplicationStore implements SellerApplicationStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async create(
    record: CreateSellerApplicationRecord
  ): Promise<SellerApplicationDetail> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO seller_applications (
           id, usuario_id, nombre_comercial, nombre_bodega, ubicacion_bodega,
           estado, creada_en, actualizada_en
         ) VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', $6, $7)`,
        [
          record.id,
          record.usuarioId,
          record.nombreComercial,
          record.nombreBodega,
          record.ubicacionBodega,
          record.creadaEn,
          record.actualizadaEn
        ]
      );
      await insertAudit(client, record.auditoria);
      await insertOutbox(client, record.evento);
      await client.query("COMMIT");
    } catch (error) {
      await rollback(client);
      if (isUniqueViolation(error)) {
        throw new UniquenessConflictError(
          "Ya existe una solicitud de vendedor pendiente para este usuario."
        );
      }
      throw new DependencyUnavailableError(
        "No fue posible registrar la solicitud de vendedor.",
        { cause: messageOf(error) }
      );
    } finally {
      client.release();
    }

    const saved = await this.findById(record.id);
    if (saved === null) {
      throw new DependencyUnavailableError(
        "La solicitud se guardó pero no pudo recuperarse."
      );
    }
    return saved;
  }

  async findById(
    applicationId: string
  ): Promise<SellerApplicationDetail | null> {
    try {
      const result = await this.pool.query<ApplicationRow>(
        `${APPLICATION_SELECT} WHERE sa.id = $1`,
        [applicationId]
      );
      const row = result.rows[0];
      return row ? toDetail(row) : null;
    } catch (error) {
      throw readError(error);
    }
  }

  async findLatestByUserId(
    usuarioId: string
  ): Promise<SellerApplicationDetail | null> {
    try {
      const result = await this.pool.query<ApplicationRow>(
        `${APPLICATION_SELECT}
          WHERE sa.usuario_id = $1
          ORDER BY sa.creada_en DESC, sa.id DESC
          LIMIT 1`,
        [usuarioId]
      );
      const row = result.rows[0];
      return row ? toDetail(row) : null;
    } catch (error) {
      throw readError(error);
    }
  }

  async findPendingByUserId(
    usuarioId: string
  ): Promise<SellerApplicationDetail | null> {
    try {
      const result = await this.pool.query<ApplicationRow>(
        `${APPLICATION_SELECT}
          WHERE sa.usuario_id = $1 AND sa.estado = 'PENDIENTE'
          ORDER BY sa.creada_en DESC, sa.id DESC
          LIMIT 1`,
        [usuarioId]
      );
      const row = result.rows[0];
      return row ? toDetail(row) : null;
    } catch (error) {
      throw readError(error);
    }
  }

  async list(filter: SellerApplicationFilter): Promise<SellerApplicationPage> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM seller_applications sa
           JOIN users u ON u.id = sa.usuario_id
          WHERE ($1::text IS NULL OR sa.estado = $1)
            AND ($2::text IS NULL
                 OR u.nombre_completo ILIKE '%' || $2 || '%'
                 OR u.correo_normalizado ILIKE '%' || $2 || '%'
                 OR sa.nombre_comercial ILIKE '%' || $2 || '%'
                 OR sa.nombre_bodega ILIKE '%' || $2 || '%')`,
        [filter.estado, filter.search]
      );
      const result = await this.pool.query<SummaryRow>(
        `${SUMMARY_SELECT}
          WHERE ($1::text IS NULL OR sa.estado = $1)
            AND ($2::text IS NULL
                 OR u.nombre_completo ILIKE '%' || $2 || '%'
                 OR u.correo_normalizado ILIKE '%' || $2 || '%'
                 OR sa.nombre_comercial ILIKE '%' || $2 || '%'
                 OR sa.nombre_bodega ILIKE '%' || $2 || '%')
          ORDER BY
            CASE sa.estado WHEN 'PENDIENTE' THEN 0 ELSE 1 END,
            sa.creada_en DESC,
            sa.id DESC
          LIMIT $3 OFFSET $4`,
        [
          filter.estado,
          filter.search,
          filter.pageSize,
          (filter.page - 1) * filter.pageSize
        ]
      );
      return {
        items: result.rows.map(toSummary),
        total: count.rows[0]?.total ?? 0,
        page: filter.page,
        pageSize: filter.pageSize
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async approve(
    input: ApproveSellerApplicationInput
  ): Promise<ApproveSellerApplicationResult> {
    const client = await this.connect();
    let sellerId = input.sellerId;
    let warehouseId = input.warehouseId;
    let yaAprobada = false;

    try {
      await client.query("BEGIN");
      const locked = await client.query<LockedApplicationRow>(
        `SELECT id, usuario_id, estado, nombre_comercial, nombre_bodega,
                ubicacion_bodega
           FROM seller_applications
          WHERE id = $1
          FOR UPDATE`,
        [input.applicationId]
      );
      const application = locked.rows[0];
      if (!application) {
        throw new ResourceNotFoundError("La solicitud de vendedor no existe.");
      }

      if (application.estado === "RECHAZADA") {
        throw new BusinessRuleError(
          "Una solicitud rechazada no puede aprobarse. El comprador debe enviar una nueva solicitud."
        );
      }

      if (application.estado === "APROBADA") {
        const existing = await firstSellerAndWarehouse(
          client,
          application.usuario_id
        );
        if (existing === null) {
          throw new DependencyUnavailableError(
            "La solicitud figura aprobada pero no tiene vendedor y bodega asociados."
          );
        }
        sellerId = existing.sellerId;
        warehouseId = existing.warehouseId;
        yaAprobada = true;
        await client.query("COMMIT");
      } else {
        const user = await client.query<{ id: string; rol: RolSistema }>(
          `SELECT id, rol FROM users WHERE id = $1 FOR UPDATE`,
          [application.usuario_id]
        );
        if (!user.rows[0]) {
          throw new ResourceNotFoundError(
            "La cuenta del solicitante no existe."
          );
        }

        const existing = await firstSellerAndWarehouse(
          client,
          application.usuario_id
        );
        if (existing !== null) {
          sellerId = existing.sellerId;
          warehouseId = existing.warehouseId;
          await client.query(
            `UPDATE users SET rol = 'VENDEDOR', actualizado_en = $2 WHERE id = $1`,
            [application.usuario_id, input.revisadoEn]
          );
        } else {
          if (user.rows[0].rol !== "COMPRADOR") {
            throw new BusinessRuleError(
              "Solo una cuenta compradora puede convertirse en vendedora."
            );
          }
          await client.query(
            `UPDATE users SET rol = 'VENDEDOR', actualizado_en = $2 WHERE id = $1`,
            [application.usuario_id, input.revisadoEn]
          );
          await client.query(
            `INSERT INTO sellers (
               id, usuario_id, nombre_comercial, estado, creado_en
             ) VALUES ($1, $2, $3, 'ACTIVO', $4)`,
            [
              sellerId,
              application.usuario_id,
              application.nombre_comercial,
              input.revisadoEn
            ]
          );
          await client.query(
            `INSERT INTO warehouses (
               id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en
             ) VALUES ($1, $2, $3, $4, 'VENDEDOR', 'ACTIVA', $5)`,
            [
              warehouseId,
              sellerId,
              application.nombre_bodega,
              application.ubicacion_bodega,
              input.revisadoEn
            ]
          );
        }

        await client.query(
          `UPDATE seller_applications
              SET estado = 'APROBADA',
                  motivo_rechazo = NULL,
                  revisado_por = $2,
                  revisado_en = $3,
                  actualizada_en = $3
            WHERE id = $1`,
          [application.id, input.actorId, input.revisadoEn]
        );
        await insertAudit(client, {
          ...input.auditoria,
          detalles: {
            ...input.auditoria.detalles,
            sellerId,
            warehouseId
          }
        });
        await insertOutbox(client, {
          ...input.evento,
          payload: {
            ...input.evento.payload,
            sellerId,
            warehouseId
          }
        });
        await client.query("COMMIT");
      }
    } catch (error) {
      await rollback(client);
      if (
        error instanceof ResourceNotFoundError ||
        error instanceof BusinessRuleError ||
        error instanceof DependencyUnavailableError
      ) {
        throw error;
      }
      if (isUniqueViolation(error)) {
        throw new BusinessRuleError(
          "El usuario ya tiene un perfil de vendedor asociado."
        );
      }
      throw new DependencyUnavailableError(
        "No fue posible aprobar la solicitud de vendedor.",
        { cause: messageOf(error) }
      );
    } finally {
      client.release();
    }

    const solicitud = await this.findById(input.applicationId);
    if (solicitud === null) {
      throw new DependencyUnavailableError(
        "La solicitud fue aprobada pero no pudo recuperarse."
      );
    }
    return { solicitud, sellerId, warehouseId, yaAprobada };
  }

  async reject(
    input: RejectSellerApplicationInput
  ): Promise<SellerApplicationDetail> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      const locked = await client.query<LockedApplicationRow>(
        `SELECT id, usuario_id, estado, nombre_comercial, nombre_bodega,
                ubicacion_bodega
           FROM seller_applications
          WHERE id = $1
          FOR UPDATE`,
        [input.applicationId]
      );
      const application = locked.rows[0];
      if (!application) {
        throw new ResourceNotFoundError("La solicitud de vendedor no existe.");
      }
      if (application.estado === "APROBADA") {
        throw new BusinessRuleError(
          "Una solicitud ya aprobada no puede rechazarse."
        );
      }
      if (application.estado === "RECHAZADA") {
        await client.query("COMMIT");
      } else {
        await client.query(
          `UPDATE seller_applications
              SET estado = 'RECHAZADA',
                  motivo_rechazo = $2,
                  revisado_por = $3,
                  revisado_en = $4,
                  actualizada_en = $4
            WHERE id = $1`,
          [application.id, input.motivo, input.actorId, input.revisadoEn]
        );
        await insertAudit(client, input.auditoria);
        await insertOutbox(client, input.evento);
        await client.query("COMMIT");
      }
    } catch (error) {
      await rollback(client);
      if (
        error instanceof ResourceNotFoundError ||
        error instanceof BusinessRuleError
      ) {
        throw error;
      }
      throw new DependencyUnavailableError(
        "No fue posible rechazar la solicitud de vendedor.",
        { cause: messageOf(error) }
      );
    } finally {
      client.release();
    }

    const solicitud = await this.findById(input.applicationId);
    if (solicitud === null) {
      throw new DependencyUnavailableError(
        "La solicitud fue rechazada pero no pudo recuperarse."
      );
    }
    return solicitud;
  }

  async healthCheck(): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
    } catch (error) {
      throw new DependencyUnavailableError(
        "La base de datos no está disponible.",
        { cause: messageOf(error) }
      );
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async connect(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible conectar con la base de datos.",
        { cause: messageOf(error) }
      );
    }
  }
}

async function firstSellerAndWarehouse(
  client: PoolClient,
  usuarioId: string
): Promise<{ sellerId: string; warehouseId: string } | null> {
  const result = await client.query<{
    seller_id: string;
    warehouse_id: string | null;
  }>(
    `SELECT s.id AS seller_id, w.id AS warehouse_id
       FROM sellers s
       LEFT JOIN warehouses w
         ON w.vendedor_id = s.id AND w.tipo = 'VENDEDOR'
      WHERE s.usuario_id = $1
      ORDER BY w.creada_en ASC NULLS LAST, w.id ASC
      LIMIT 1`,
    [usuarioId]
  );
  const row = result.rows[0];
  if (!row || row.warehouse_id === null) {
    return null;
  }
  return { sellerId: row.seller_id, warehouseId: row.warehouse_id };
}

async function insertAudit(
  client: PoolClient,
  auditoria: RegistroAuditoria
): Promise<void> {
  await client.query(
    `INSERT INTO audit_log (
       id, evento, recurso_tipo, recurso_id, actor_id, rol_actor, ocurrido_en,
       correlation_id, causation_id, resultado, gravedad, detalles
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      auditoria.id,
      auditoria.evento,
      auditoria.recursoTipo,
      auditoria.recursoId,
      auditoria.actorId,
      auditoria.rolActor ?? null,
      auditoria.ocurridoEn.value,
      auditoria.correlationId,
      auditoria.causationId ?? null,
      auditoria.resultado,
      auditoria.gravedad,
      auditoria.detalles
    ]
  );
}

async function insertOutbox(
  client: PoolClient,
  evento: EventoDominio
): Promise<void> {
  await client.query(
    `INSERT INTO outbox (
       id, tipo, version_esquema, agregado_tipo, agregado_id, ocurrido_en,
       correlation_id, payload
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      evento.id,
      evento.tipo,
      evento.versionEsquema,
      evento.agregadoTipo,
      evento.agregadoId,
      evento.ocurridoEn.value,
      evento.correlationId,
      evento.payload
    ]
  );
}

function toSummary(row: SummaryRow): SellerApplicationSummary {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nombreCompleto: row.nombre_completo,
    correoElectronico: row.correo_normalizado,
    nombreComercial: row.nombre_comercial,
    nombreBodega: row.nombre_bodega,
    estado: row.estado,
    creadaEn: row.creada_en.toISOString(),
    actualizadaEn: row.actualizada_en.toISOString()
  };
}

function toDetail(row: ApplicationRow): SellerApplicationDetail {
  return {
    ...toSummary(row),
    ubicacionBodega: row.ubicacion_bodega,
    motivoRechazo: row.motivo_rechazo,
    revisadoPor: row.revisado_por,
    revisadoEn: row.revisado_en?.toISOString() ?? null,
    sellerId: row.seller_id,
    warehouseId: row.warehouse_id,
    usuarioRol: row.usuario_rol,
    usuarioEstado: row.usuario_estado
  };
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Se informa el error original.
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}

function readError(error: unknown): DependencyUnavailableError {
  return new DependencyUnavailableError(
    "No fue posible consultar las solicitudes de vendedor.",
    { cause: messageOf(error) }
  );
}
