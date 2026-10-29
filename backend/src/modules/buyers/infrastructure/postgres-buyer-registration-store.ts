import { Pool, type PoolClient } from "pg";
import {
  DependencyUnavailableError,
  UniquenessConflictError
} from "../../../shared/domain/errors.js";
import type { CorreoElectronico, DocumentoIdentidad } from "../../../shared/domain/value-objects.js";
import type { BuyerRegistrationRecord, BuyerRegistrationStore } from "../application/ports.js";

export class PostgresBuyerRegistrationStore implements BuyerRegistrationStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async existsByEmail(email: CorreoElectronico): Promise<boolean> {
    try {
      const result = await this.pool.query(
        "SELECT 1 FROM users WHERE correo_normalizado = $1 LIMIT 1",
        [email.value]
      );
      return result.rowCount === 1;
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible consultar la base de datos.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  async existsByDocument(documento: DocumentoIdentidad): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT 1
           FROM users
          WHERE documento_tipo = $1
            AND documento_pais = $2
            AND documento_numero = $3
          LIMIT 1`,
        [documento.tipo, documento.pais, documento.numero]
      );
      return result.rowCount === 1;
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible consultar la base de datos.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  async saveRegistration(record: BuyerRegistrationRecord): Promise<void> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO users (
           id, nombre_completo, correo_normalizado, documento_tipo, documento_pais,
           documento_numero, hash_credencial, rol, estado, creado_en, actualizado_en
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          record.usuario.id,
          record.usuario.nombreCompleto.value,
          record.usuario.correoElectronico.value,
          record.usuario.documentoIdentidad.tipo,
          record.usuario.documentoIdentidad.pais,
          record.usuario.documentoIdentidad.numero,
          record.usuario.credencial.value,
          record.usuario.rol,
          record.usuario.estado,
          record.usuario.creadoEn.value,
          record.usuario.actualizadoEn.value
        ]
      );
      await client.query(
        `INSERT INTO buyers (id, usuario_id, estado_comercial, creado_en)
         VALUES ($1, $2, $3, $4)`,
        [
          record.comprador.id,
          record.comprador.usuarioId,
          record.comprador.estadoComercial,
          record.comprador.creadoEn.value
        ]
      );
      await client.query(
        `INSERT INTO carts (id, comprador_id, actualizado_en, version)
         VALUES ($1, $2, $3, $4)`,
        [
          record.carrito.id,
          record.carrito.compradorId,
          record.carrito.actualizadoEn.value,
          record.carrito.version
        ]
      );
      await client.query(
        `INSERT INTO audit_log (
           id, evento, recurso_tipo, recurso_id, actor_id, rol_actor, ocurrido_en,
           correlation_id, causation_id, resultado, gravedad, detalles
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          record.auditoria.id,
          record.auditoria.evento,
          record.auditoria.recursoTipo,
          record.auditoria.recursoId,
          record.auditoria.actorId,
          record.auditoria.rolActor ?? null,
          record.auditoria.ocurridoEn.value,
          record.auditoria.correlationId,
          record.auditoria.causationId ?? null,
          record.auditoria.resultado,
          record.auditoria.gravedad,
          record.auditoria.detalles
        ]
      );
      await client.query(
        `INSERT INTO outbox (
           id, tipo, version_esquema, agregado_tipo, agregado_id, ocurrido_en,
           correlation_id, payload
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          record.evento.id,
          record.evento.tipo,
          record.evento.versionEsquema,
          record.evento.agregadoTipo,
          record.evento.agregadoId,
          record.evento.ocurridoEn.value,
          record.evento.correlationId,
          record.evento.payload
        ]
      );
      await client.query("COMMIT");
    } catch (error) {
      await this.rollback(client);
      if (isUniqueViolation(error)) {
        throw new UniquenessConflictError("El correo o el documento ya están registrados.");
      }
      throw new DependencyUnavailableError("No fue posible completar el registro.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
    } catch (error) {
      throw new DependencyUnavailableError("La base de datos no está disponible.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async connect(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible conectar con la base de datos.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  private async rollback(client: PoolClient): Promise<void> {
    try {
      await client.query("ROLLBACK");
    } catch {
      // El error original es el que se informa.
    }
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
