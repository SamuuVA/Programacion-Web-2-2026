import { Pool, type PoolClient } from "pg";
import {
  BusinessRuleError,
  DependencyUnavailableError,
  ResourceNotFoundError
} from "../../../shared/domain/errors.js";
import type { EstadoUsuario, RolSistema } from "../domain/usuario.js";
import type {
  ApplyUserAccessTransitionInput,
  UserAccessRecord,
  UserAccessStore,
  UserAccessTransitionResult
} from "../application/update-user-access-status.js";

interface UserRow {
  id: string;
  rol: RolSistema;
  estado: EstadoUsuario;
  actualizado_en: Date;
}

export class PostgresUserAccessStore implements UserAccessStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async findUser(usuarioId: string): Promise<UserAccessRecord | null> {
    try {
      const result = await this.pool.query<UserRow>(
        `SELECT id, rol, estado, actualizado_en FROM users WHERE id = $1`,
        [usuarioId]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return {
        usuarioId: row.id,
        rol: row.rol,
        estado: row.estado,
        actualizadoEn: row.actualizado_en.toISOString()
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async applyTransition(
    input: ApplyUserAccessTransitionInput
  ): Promise<UserAccessTransitionResult> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query<UserRow>(
        `SELECT id, rol, estado, actualizado_en
           FROM users
          WHERE id = $1
          FOR UPDATE`,
        [input.usuarioId]
      );
      const row = current.rows[0];
      if (!row) {
        throw new ResourceNotFoundError("La cuenta no existe.");
      }
      if (row.estado !== input.estadoEsperado) {
        throw new BusinessRuleError(
          "La cuenta cambió de estado desde que se leyó. Recarga e intenta de nuevo.",
          {
            estadoEsperado: input.estadoEsperado,
            estadoActual: row.estado
          }
        );
      }

      const updated = await client.query<{ actualizado_en: Date }>(
        `UPDATE users
            SET estado = $2, actualizado_en = $3
          WHERE id = $1
          RETURNING actualizado_en`,
        [input.usuarioId, input.estadoNuevo, input.ocurridoEn]
      );
      const actualizadoEn = updated.rows[0]?.actualizado_en;
      if (!actualizadoEn) {
        throw new DependencyUnavailableError(
          "No fue posible actualizar el estado de la cuenta."
        );
      }

      let sesionesRevocadas = 0;
      if (input.revocarSesiones) {
        const revoked = await client.query(
          `UPDATE sessions
              SET revocada_en = $2
            WHERE usuario_id = $1
              AND revocada_en IS NULL`,
          [input.usuarioId, input.ocurridoEn]
        );
        sesionesRevocadas = revoked.rowCount ?? 0;
      }

      await client.query(
        `INSERT INTO audit_log (
           id, evento, recurso_tipo, recurso_id, actor_id, rol_actor, ocurrido_en,
           correlation_id, causation_id, resultado, gravedad, detalles
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          input.auditId,
          "user.access-status.changed.v1",
          "Usuario",
          input.usuarioId,
          input.actorId,
          input.actorRol,
          input.ocurridoEn,
          input.correlationId,
          null,
          "EXITO",
          "INFORMACION",
          {
            estadoAnterior: row.estado,
            estadoNuevo: input.estadoNuevo,
            accion: input.accion,
            motivo: input.motivo,
            sesionesRevocadas
          }
        ]
      );

      await client.query("COMMIT");
      return {
        usuarioId: input.usuarioId,
        estadoAnterior: row.estado,
        estadoNuevo: input.estadoNuevo,
        actualizadoEn: actualizadoEn.toISOString(),
        sesionesRevocadas
      };
    } catch (error) {
      await rollback(client);
      if (
        error instanceof ResourceNotFoundError ||
        error instanceof BusinessRuleError ||
        error instanceof DependencyUnavailableError
      ) {
        throw error;
      }
      throw new DependencyUnavailableError(
        "No fue posible cambiar el estado de acceso.",
        { cause: messageOf(error) }
      );
    } finally {
      client.release();
    }
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

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Se informa el error original.
  }
}

function readError(error: unknown): DependencyUnavailableError {
  return new DependencyUnavailableError("No fue posible consultar la cuenta.", {
    cause: messageOf(error)
  });
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
