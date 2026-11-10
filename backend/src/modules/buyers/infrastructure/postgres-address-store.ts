import { Pool, type PoolClient } from "pg";
import { DependencyUnavailableError } from "../../../shared/domain/errors.js";
import { DireccionEntrega } from "../domain/direccion-entrega.js";
import type { AddressStore } from "../application/address-ports.js";

interface AddressRow {
  id: string;
  comprador_id: string;
  destinatario: string;
  telefono: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  region: string;
  codigo_postal: string | null;
  pais: string;
  es_principal: boolean;
  creada_en: Date;
  actualizada_en: Date;
}

export class PostgresAddressStore implements AddressStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async list(compradorId: string): Promise<DireccionEntrega[]> {
    try {
      const result = await this.pool.query<AddressRow>(
        `SELECT *
           FROM buyer_addresses
          WHERE comprador_id = $1
          ORDER BY es_principal DESC, creada_en ASC`,
        [compradorId]
      );
      return result.rows.map(toDomain);
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible consultar las direcciones.",
        {
          cause: messageOf(error)
        }
      );
    }
  }

  async findById(
    compradorId: string,
    direccionId: string
  ): Promise<DireccionEntrega | null> {
    try {
      const result = await this.pool.query<AddressRow>(
        `SELECT *
           FROM buyer_addresses
          WHERE comprador_id = $1
            AND id = $2
          LIMIT 1`,
        [compradorId, direccionId]
      );
      const row = result.rows[0];
      return row ? toDomain(row) : null;
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible consultar la dirección.",
        {
          cause: messageOf(error)
        }
      );
    }
  }

  async create(direccion: DireccionEntrega): Promise<void> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await lockBuyer(client, direccion.compradorId);
      if (direccion.esPrincipal) {
        await client.query(
          `UPDATE buyer_addresses
              SET es_principal = false
            WHERE comprador_id = $1
              AND es_principal`,
          [direccion.compradorId]
        );
      }
      await client.query(
        `INSERT INTO buyer_addresses (
           id, comprador_id, destinatario, telefono, linea1, linea2, ciudad,
           region, codigo_postal, pais, es_principal, creada_en, actualizada_en
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          direccion.id,
          direccion.compradorId,
          direccion.destinatario,
          direccion.telefono,
          direccion.linea1,
          direccion.linea2,
          direccion.ciudad,
          direccion.region,
          direccion.codigoPostal,
          direccion.pais,
          direccion.esPrincipal,
          direccion.creadaEn,
          direccion.actualizadaEn
        ]
      );
      await client.query("COMMIT");
    } catch (error) {
      await rollback(client);
      throw new DependencyUnavailableError(
        "No fue posible guardar la dirección.",
        {
          cause: messageOf(error)
        }
      );
    } finally {
      client.release();
    }
  }

  async update(direccion: DireccionEntrega): Promise<void> {
    try {
      const result = await this.pool.query(
        `UPDATE buyer_addresses
            SET destinatario = $3,
                telefono = $4,
                linea1 = $5,
                linea2 = $6,
                ciudad = $7,
                region = $8,
                codigo_postal = $9,
                pais = $10,
                actualizada_en = $11
          WHERE comprador_id = $1
            AND id = $2`,
        [
          direccion.compradorId,
          direccion.id,
          direccion.destinatario,
          direccion.telefono,
          direccion.linea1,
          direccion.linea2,
          direccion.ciudad,
          direccion.region,
          direccion.codigoPostal,
          direccion.pais,
          direccion.actualizadaEn
        ]
      );
      if (result.rowCount !== 1) {
        throw new DependencyUnavailableError(
          "La dirección dejó de existir durante la actualización."
        );
      }
    } catch (error) {
      if (error instanceof DependencyUnavailableError) {
        throw error;
      }
      throw new DependencyUnavailableError(
        "No fue posible actualizar la dirección.",
        {
          cause: messageOf(error)
        }
      );
    }
  }

  async delete(compradorId: string, direccionId: string): Promise<boolean> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await lockBuyer(client, compradorId);
      const deleted = await client.query<{ es_principal: boolean }>(
        `DELETE FROM buyer_addresses
          WHERE comprador_id = $1
            AND id = $2
          RETURNING es_principal`,
        [compradorId, direccionId]
      );
      if (deleted.rowCount !== 1) {
        await client.query("COMMIT");
        return false;
      }
      if (deleted.rows[0]?.es_principal === true) {
        await client.query(
          `UPDATE buyer_addresses
              SET es_principal = true,
                  actualizada_en = now()
            WHERE id = (
              SELECT id
                FROM buyer_addresses
               WHERE comprador_id = $1
               ORDER BY creada_en ASC
               LIMIT 1
            )`,
          [compradorId]
        );
      }
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await rollback(client);
      throw new DependencyUnavailableError(
        "No fue posible eliminar la dirección.",
        {
          cause: messageOf(error)
        }
      );
    } finally {
      client.release();
    }
  }

  async setPrincipal(
    compradorId: string,
    direccionId: string,
    at: string
  ): Promise<boolean> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await lockBuyer(client, compradorId);
      const exists = await client.query(
        `SELECT 1 FROM buyer_addresses WHERE comprador_id = $1 AND id = $2 FOR UPDATE`,
        [compradorId, direccionId]
      );
      if (exists.rowCount !== 1) {
        await client.query("COMMIT");
        return false;
      }
      await client.query(
        `UPDATE buyer_addresses
            SET es_principal = false
          WHERE comprador_id = $1
            AND es_principal`,
        [compradorId]
      );
      await client.query(
        `UPDATE buyer_addresses
            SET es_principal = true,
                actualizada_en = $3
          WHERE comprador_id = $1
            AND id = $2`,
        [compradorId, direccionId, at]
      );
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await rollback(client);
      throw new DependencyUnavailableError(
        "No fue posible cambiar la dirección principal.",
        {
          cause: messageOf(error)
        }
      );
    } finally {
      client.release();
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
        {
          cause: messageOf(error)
        }
      );
    }
  }
}

async function lockBuyer(
  client: PoolClient,
  compradorId: string
): Promise<void> {
  await client.query("SELECT id FROM buyers WHERE id = $1 FOR UPDATE", [
    compradorId
  ]);
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Se informa el error original.
  }
}

function toDomain(row: AddressRow): DireccionEntrega {
  return DireccionEntrega.create({
    id: row.id,
    compradorId: row.comprador_id,
    destinatario: row.destinatario,
    telefono: row.telefono,
    linea1: row.linea1,
    linea2: row.linea2,
    ciudad: row.ciudad,
    region: row.region,
    codigoPostal: row.codigo_postal,
    pais: row.pais,
    esPrincipal: row.es_principal,
    creadaEn: row.creada_en.toISOString(),
    actualizadaEn: row.actualizada_en.toISOString()
  });
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
