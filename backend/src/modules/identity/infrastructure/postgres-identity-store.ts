import { Pool } from "pg";
import { DependencyUnavailableError } from "../../../shared/domain/errors.js";
import type {
  CredentialRecord,
  IdentityStore,
  SessionRecord,
  StoredSession
} from "../application/ports.js";

interface CredentialRow {
  usuario_id: string;
  nombre_completo: string;
  correo_normalizado: string;
  hash_credencial: string;
  rol: CredentialRecord["rol"];
  estado: CredentialRecord["estado"];
  comprador_id: string | null;
  seller_id: string | null;
}

interface SessionRow extends CredentialRow {
  session_id: string;
  token_hash: string;
  creada_en: Date;
  expira_en: Date;
  correlation_id: string;
}

export class PostgresIdentityStore implements IdentityStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async findCredentialsByEmail(
    email: string
  ): Promise<CredentialRecord | null> {
    try {
      const result = await this.pool.query<CredentialRow>(
        `SELECT u.id AS usuario_id,
                u.nombre_completo,
                u.correo_normalizado,
                u.hash_credencial,
                u.rol,
                u.estado,
                b.id AS comprador_id,
                s.id AS seller_id
           FROM users u
           LEFT JOIN buyers b ON b.usuario_id = u.id
           LEFT JOIN sellers s ON s.usuario_id = u.id
          WHERE u.correo_normalizado = $1
          LIMIT 1`,
        [email]
      );
      const row = result.rows[0];
      return row ? toCredential(row) : null;
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible consultar la identidad.",
        {
          cause: messageOf(error)
        }
      );
    }
  }

  async createSession(record: SessionRecord): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO sessions (
           id, usuario_id, token_hash, creada_en, expira_en,
           ultima_actividad_en, correlation_id
         ) VALUES ($1, $2, $3, $4, $5, $4, $6)`,
        [
          record.id,
          record.usuarioId,
          record.tokenHash,
          record.creadaEn,
          record.expiraEn,
          record.correlationId
        ]
      );
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible guardar la sesión.",
        {
          cause: messageOf(error)
        }
      );
    }
  }

  async findSessionByTokenHash(
    tokenHash: string
  ): Promise<StoredSession | null> {
    try {
      const result = await this.pool.query<SessionRow>(
        `SELECT se.id AS session_id,
                se.usuario_id,
                se.token_hash,
                se.creada_en,
                se.expira_en,
                se.correlation_id,
                u.nombre_completo,
                u.correo_normalizado,
                u.hash_credencial,
                u.rol,
                u.estado,
                b.id AS comprador_id,
                s.id AS seller_id
           FROM sessions se
           JOIN users u ON u.id = se.usuario_id
           LEFT JOIN buyers b ON b.usuario_id = u.id
           LEFT JOIN sellers s ON s.usuario_id = u.id
          WHERE se.token_hash = $1
            AND se.revocada_en IS NULL
          LIMIT 1`,
        [tokenHash]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return {
        session: {
          id: row.session_id,
          usuarioId: row.usuario_id,
          tokenHash: row.token_hash,
          creadaEn: row.creada_en.toISOString(),
          expiraEn: row.expira_en.toISOString(),
          correlationId: row.correlation_id
        },
        user: {
          usuarioId: row.usuario_id,
          nombreCompleto: row.nombre_completo,
          correoElectronico: row.correo_normalizado,
          rol: row.rol,
          estado: row.estado,
          compradorId: row.comprador_id,
          sellerId: row.seller_id
        }
      };
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible consultar la sesión.",
        {
          cause: messageOf(error)
        }
      );
    }
  }

  async touchSession(tokenHash: string, at: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE sessions
            SET ultima_actividad_en = $2
          WHERE token_hash = $1
            AND revocada_en IS NULL`,
        [tokenHash, at]
      );
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible actualizar la sesión.",
        {
          cause: messageOf(error)
        }
      );
    }
  }

  async revokeSession(tokenHash: string, at: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE sessions
            SET revocada_en = $2
          WHERE token_hash = $1
            AND revocada_en IS NULL`,
        [tokenHash, at]
      );
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible cerrar la sesión.", {
        cause: messageOf(error)
      });
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
    } catch (error) {
      throw new DependencyUnavailableError(
        "La base de datos no está disponible.",
        {
          cause: messageOf(error)
        }
      );
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function toCredential(row: CredentialRow): CredentialRecord {
  return {
    usuarioId: row.usuario_id,
    nombreCompleto: row.nombre_completo,
    correoElectronico: row.correo_normalizado,
    hashCredencial: row.hash_credencial,
    rol: row.rol,
    estado: row.estado,
    compradorId: row.comprador_id,
    sellerId: row.seller_id
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
