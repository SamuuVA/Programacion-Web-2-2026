import { Pool, type PoolClient } from "pg";
import {
  DependencyUnavailableError,
  ResourceNotFoundError
} from "../../../shared/domain/errors.js";
import type {
  CartItemState,
  CartLineView,
  CartStore,
  CartView,
  MotivoNoVendible,
  SellableProduct
} from "../application/ports.js";

interface CartRow {
  carrito_id: string;
  comprador_id: string;
  actualizado_en: Date;
  version: number;
}

interface ProductRow {
  producto_id: string;
  nombre: string;
  sku: string;
  categoria: SellableProduct["categoria"];
  tipo_entrega: SellableProduct["tipoEntrega"];
  precio_centavos: string | number;
  moneda: string;
  estado_producto: SellableProduct["estadoProducto"];
  vendedor_id: string;
  vendedor_nombre: string;
  estado_vendedor: SellableProduct["estadoVendedor"];
  disponible: string | number | null;
}

interface CartLineRow extends ProductRow {
  cantidad: number;
  precio_referencial_centavos: string | number;
  moneda_referencial: string;
}

const PRODUCT_SELECT = `
  SELECT p.id AS producto_id,
         p.nombre,
         p.sku,
         p.categoria,
         p.tipo_entrega,
         p.precio_centavos,
         p.moneda,
         p.estado AS estado_producto,
         s.id AS vendedor_id,
         s.nombre_comercial AS vendedor_nombre,
         s.estado AS estado_vendedor,
         CASE WHEN p.tipo_entrega = 'FISICA' THEN COALESCE((
           SELECT SUM(GREATEST(i.on_hand - i.reserved - i.unavailable, 0))
             FROM inventory i
             JOIN warehouses w ON w.id = i.bodega_id
            WHERE i.producto_id = p.id
              AND w.estado = 'ACTIVA'
         ), 0)::int ELSE NULL END AS disponible
    FROM products p
    JOIN sellers s ON s.id = p.vendedor_id`;

export class PostgresCartStore implements CartStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async getCart(compradorId: string): Promise<CartView> {
    try {
      const cartResult = await this.pool.query<CartRow>(
        `SELECT id AS carrito_id, comprador_id, actualizado_en, version
           FROM carts
          WHERE comprador_id = $1
          LIMIT 1`,
        [compradorId]
      );
      const cart = cartResult.rows[0];
      if (!cart) {
        throw new ResourceNotFoundError("El comprador no tiene un carrito activo.");
      }

      const linesResult = await this.pool.query<CartLineRow>(
        `SELECT ci.producto_id,
                ci.cantidad,
                ci.precio_referencial_centavos,
                ci.moneda_referencial,
                p.nombre,
                p.sku,
                p.categoria,
                p.tipo_entrega,
                p.precio_centavos,
                p.moneda,
                p.estado AS estado_producto,
                s.id AS vendedor_id,
                s.nombre_comercial AS vendedor_nombre,
                s.estado AS estado_vendedor,
                CASE WHEN p.tipo_entrega = 'FISICA' THEN COALESCE((
                  SELECT SUM(GREATEST(i.on_hand - i.reserved - i.unavailable, 0))
                    FROM inventory i
                    JOIN warehouses w ON w.id = i.bodega_id
                   WHERE i.producto_id = p.id
                     AND w.estado = 'ACTIVA'
                ), 0)::int ELSE NULL END AS disponible
           FROM cart_items ci
           JOIN products p ON p.id = ci.producto_id
           JOIN sellers s ON s.id = p.vendedor_id
          WHERE ci.carrito_id = $1
          ORDER BY ci.agregado_en ASC, p.nombre ASC`,
        [cart.carrito_id]
      );

      const items = linesResult.rows.map(toCartLine);
      const totalCentavos = items.reduce((sum, item) => sum + item.subtotalCentavos, 0);
      const requiereConfirmacionPrecio = items.some(
        (item) =>
          item.precioReferencialCentavos !== item.precioCentavos ||
          item.monedaReferencial !== item.moneda
      );

      return {
        carritoId: cart.carrito_id,
        compradorId: cart.comprador_id,
        items,
        totalCentavos,
        moneda: items[0]?.moneda ?? null,
        actualizadoEn: cart.actualizado_en.toISOString(),
        version: cart.version,
        requiereConfirmacionPrecio
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      throw new DependencyUnavailableError("No fue posible consultar el carrito.", {
        cause: messageOf(error)
      });
    }
  }

  async findProduct(productoId: string): Promise<SellableProduct | null> {
    try {
      const result = await this.pool.query<ProductRow>(
        `${PRODUCT_SELECT}
          WHERE p.id = $1
          LIMIT 1`,
        [productoId]
      );
      const row = result.rows[0];
      return row ? toSellableProduct(row) : null;
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible consultar el producto.", {
        cause: messageOf(error)
      });
    }
  }

  async getItem(compradorId: string, productoId: string): Promise<CartItemState | null> {
    try {
      const result = await this.pool.query<{
        cantidad: number;
        precio_referencial_centavos: string | number;
        moneda_referencial: string;
      }>(
        `SELECT ci.cantidad, ci.precio_referencial_centavos, ci.moneda_referencial
           FROM cart_items ci
           JOIN carts c ON c.id = ci.carrito_id
          WHERE c.comprador_id = $1
            AND ci.producto_id = $2
          LIMIT 1`,
        [compradorId, productoId]
      );
      const row = result.rows[0];
      return row
        ? {
            cantidad: row.cantidad,
            precioReferencialCentavos: toInteger(row.precio_referencial_centavos),
            monedaReferencial: row.moneda_referencial
          }
        : null;
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible consultar la línea del carrito.", {
        cause: messageOf(error)
      });
    }
  }

  async upsertItem(input: {
    compradorId: string;
    productoId: string;
    cantidad: number;
    precioCentavos: number;
    moneda: string;
    now: string;
  }): Promise<void> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      const cartId = await lockCart(client, input.compradorId);
      await client.query(
        `INSERT INTO cart_items (
           carrito_id, producto_id, cantidad, precio_referencial_centavos,
           moneda_referencial, agregado_en, actualizado_en
         ) VALUES ($1, $2, $3, $4, $5, $6, $6)
         ON CONFLICT (carrito_id, producto_id) DO UPDATE SET
           cantidad = EXCLUDED.cantidad,
           precio_referencial_centavos = EXCLUDED.precio_referencial_centavos,
           moneda_referencial = EXCLUDED.moneda_referencial,
           actualizado_en = EXCLUDED.actualizado_en`,
        [
          cartId,
          input.productoId,
          input.cantidad,
          input.precioCentavos,
          input.moneda,
          input.now
        ]
      );
      await client.query(
        `UPDATE carts
            SET actualizado_en = $2,
                version = version + 1
          WHERE id = $1`,
        [cartId, input.now]
      );
      await client.query("COMMIT");
    } catch (error) {
      await rollback(client);
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      throw new DependencyUnavailableError("No fue posible actualizar el carrito.", {
        cause: messageOf(error)
      });
    } finally {
      client.release();
    }
  }

  async removeItem(compradorId: string, productoId: string, now: string): Promise<boolean> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      const cartId = await lockCart(client, compradorId);
      const deleted = await client.query(
        `DELETE FROM cart_items WHERE carrito_id = $1 AND producto_id = $2`,
        [cartId, productoId]
      );
      if (deleted.rowCount === 1) {
        await client.query(
          `UPDATE carts
              SET actualizado_en = $2,
                  version = version + 1
            WHERE id = $1`,
          [cartId, now]
        );
      }
      await client.query("COMMIT");
      return deleted.rowCount === 1;
    } catch (error) {
      await rollback(client);
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      throw new DependencyUnavailableError("No fue posible actualizar el carrito.", {
        cause: messageOf(error)
      });
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
      throw new DependencyUnavailableError("No fue posible conectar con la base de datos.", {
        cause: messageOf(error)
      });
    }
  }
}

async function lockCart(client: PoolClient, compradorId: string): Promise<string> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM carts WHERE comprador_id = $1 FOR UPDATE`,
    [compradorId]
  );
  const row = result.rows[0];
  if (!row) {
    throw new ResourceNotFoundError("El comprador no tiene un carrito activo.");
  }
  return row.id;
}

function toSellableProduct(row: ProductRow): SellableProduct {
  return {
    productoId: row.producto_id,
    nombre: row.nombre,
    sku: row.sku,
    categoria: row.categoria,
    tipoEntrega: row.tipo_entrega,
    precioCentavos: toInteger(row.precio_centavos),
    moneda: row.moneda,
    estadoProducto: row.estado_producto,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    estadoVendedor: row.estado_vendedor,
    disponible: row.disponible === null ? null : toInteger(row.disponible)
  };
}

function toCartLine(row: CartLineRow): CartLineView {
  const product = toSellableProduct(row);
  const motivo = motivoNoVendible(product, row.cantidad);
  return {
    ...product,
    cantidad: row.cantidad,
    precioReferencialCentavos: toInteger(row.precio_referencial_centavos),
    monedaReferencial: row.moneda_referencial,
    subtotalCentavos: product.precioCentavos * row.cantidad,
    vendible: motivo === null,
    motivoNoVendible: motivo
  };
}

function motivoNoVendible(
  product: SellableProduct,
  cantidad: number
): MotivoNoVendible | null {
  if (product.estadoProducto !== "PUBLICADO") {
    return "PRODUCTO_NO_PUBLICADO";
  }
  if (product.estadoVendedor !== "ACTIVO") {
    return "VENDEDOR_NO_ACTIVO";
  }
  if (
    product.tipoEntrega === "FISICA" &&
    cantidad > (product.disponible ?? 0)
  ) {
    return "STOCK_INSUFICIENTE";
  }
  return null;
}

function toInteger(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error("Valor numérico inválido en la base de datos.");
  }
  return parsed;
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Se informa el error original.
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
