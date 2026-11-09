import { Pool, type PoolClient } from "pg";
import {
  ApplicationError,
  AuthorizationError,
  BusinessRuleError,
  DependencyUnavailableError,
  ResourceNotFoundError,
  UniquenessConflictError
} from "../../../shared/domain/errors.js";
import {
  assertBodegaActiva,
  assertProductoConInventario,
  assertProductoFisico
} from "../domain/inventario-vendedor.js";
import type {
  AddImageRecord,
  CreateProductRecord,
  CreateWarehouseRecord,
  IngressCommand,
  IngressResult,
  SellerInventoryView,
  SellerOrderDetail,
  SellerOrderItemView,
  SellerOrderSummary,
  SellerProductView,
  SellerProfileView,
  SellerWarehouseView,
  SellerWorkspaceStore,
  WarehouseChanges
} from "../application/ports.js";
import type {
  DatosProducto,
  EstadoProductoVendedor,
  ImagenProductoVendedor,
  ProductoVendedor,
  TipoEntregaVendedor
} from "../domain/producto-vendedor.js";

type Db = Pool | PoolClient;

interface ProfileRow {
  id: string;
  usuario_id: string;
  nombre_comercial: string;
  estado: SellerProfileView["estado"];
  creado_en: Date;
  nombre_completo: string;
  correo_normalizado: string;
}

interface ProductRow {
  id: string;
  vendedor_id: string;
  nombre: string;
  descripcion: string;
  categoria: ProductoVendedor["categoria"];
  estado: EstadoProductoVendedor;
  tipo_entrega: TipoEntregaVendedor;
  sku: string;
  precio_centavos: string | number;
  moneda: string;
  creado_en: Date;
  actualizado_en: Date;
  on_hand: number | null;
  reserved: number | null;
  unavailable: number | null;
}

interface ImageRow {
  id: string;
  producto_id: string;
  url: string;
  alt: string;
  orden: number;
}

interface WarehouseRow {
  id: string;
  vendedor_id: string;
  nombre: string;
  ubicacion: string;
  estado: SellerWarehouseView["estado"];
  creada_en: Date;
}

interface InventoryRow {
  producto_id: string;
  producto_nombre: string;
  sku: string;
  bodega_id: string;
  bodega_nombre: string;
  on_hand: number;
  reserved: number;
  unavailable: number;
  actualizado_en: Date;
}

interface OrderRow {
  id: string;
  numero: string;
  estado: SellerOrderSummary["estado"];
  estado_pago: SellerOrderSummary["estadoPago"];
  moneda: string;
  total_centavos: string | number;
  items_count: number;
  creado_en: Date;
}

interface OrderItemRow {
  id: string;
  producto_id: string;
  nombre_producto: string;
  sku: string;
  tipo_entrega: TipoEntregaVendedor;
  cantidad: number;
  precio_unitario_centavos: string | number;
  moneda: string;
  subtotal_centavos: string | number;
}

const PRODUCT_SELECT = `
  SELECT p.id, p.vendedor_id, p.nombre, p.descripcion, p.categoria, p.estado,
         p.tipo_entrega, p.sku, p.precio_centavos, p.moneda,
         p.creado_en, p.actualizado_en,
         i.on_hand, i.reserved, i.unavailable
    FROM products p
    LEFT JOIN (
      SELECT producto_id,
             SUM(on_hand)::int AS on_hand,
             SUM(reserved)::int AS reserved,
             SUM(unavailable)::int AS unavailable
        FROM inventory
       GROUP BY producto_id
    ) i ON i.producto_id = p.id
`;

export class PostgresSellerWorkspaceStore implements SellerWorkspaceStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async findProfile(sellerId: string): Promise<SellerProfileView | null> {
    try {
      const result = await this.pool.query<ProfileRow>(
        `SELECT s.id, s.usuario_id, s.nombre_comercial, s.estado, s.creado_en,
                u.nombre_completo, u.correo_normalizado
           FROM sellers s
           JOIN users u ON u.id = s.usuario_id
          WHERE s.id = $1`,
        [sellerId]
      );
      const row = result.rows[0];
      return row ? toProfile(row) : null;
    } catch (error) {
      throw readError(error);
    }
  }

  async updateProfile(
    sellerId: string,
    nombreComercial: string,
    _now: string
  ): Promise<SellerProfileView | null> {
    try {
      const result = await this.pool.query<{ id: string }>(
        `UPDATE sellers
            SET nombre_comercial = $2
          WHERE id = $1
          RETURNING id`,
        [sellerId, nombreComercial]
      );
      if (result.rowCount === 0) {
        return null;
      }
      return this.findProfile(sellerId);
    } catch (error) {
      throw writeError(error);
    }
  }

  async listProducts(sellerId: string): Promise<SellerProductView[]> {
    try {
      const products = await this.pool.query<ProductRow>(
        `${PRODUCT_SELECT}
          WHERE p.vendedor_id = $1
          ORDER BY p.creado_en DESC, p.id DESC`,
        [sellerId]
      );
      const images = await this.loadImages(
        this.pool,
        products.rows.map((row) => row.id)
      );
      return products.rows.map((row) => toProduct(row, images.get(row.id) ?? []));
    } catch (error) {
      throw readError(error);
    }
  }

  async findProduct(
    sellerId: string,
    productoId: string
  ): Promise<SellerProductView | null> {
    return this.loadProduct(this.pool, sellerId, productoId);
  }

  async createProduct(record: CreateProductRecord): Promise<SellerProductView> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO products (
           id, vendedor_id, nombre, descripcion, categoria, estado, tipo_entrega,
           sku, precio_centavos, moneda, creado_en, actualizado_en
         ) VALUES ($1, $2, $3, $4, $5, 'BORRADOR', $6, $7, $8, $9, $10, $10)`,
        [
          record.id,
          record.vendedorId,
          record.datos.nombre,
          record.datos.descripcion,
          record.datos.categoria,
          record.datos.tipoEntrega,
          record.datos.sku,
          record.datos.precioCentavos,
          record.datos.moneda,
          record.creadoEn
        ]
      );
      for (const imagen of record.imagenes) {
        await client.query(
          `INSERT INTO product_images (id, producto_id, url, alt, orden, creado_en)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [imagen.id, record.id, imagen.url, imagen.alt, imagen.orden, record.creadoEn]
        );
      }
      const product = await this.loadProduct(client, record.vendedorId, record.id);
      if (product === null) {
        throw new ResourceNotFoundError("El producto no pudo recuperarse.");
      }
      await client.query("COMMIT");
      return product;
    } catch (error) {
      await rollback(client);
      throw writeError(error);
    } finally {
      client.release();
    }
  }

  async updateProduct(
    sellerId: string,
    productoId: string,
    datos: DatosProducto,
    now: string
  ): Promise<SellerProductView | null> {
    try {
      const result = await this.pool.query<{ id: string }>(
        `UPDATE products
            SET nombre = $3,
                descripcion = $4,
                categoria = $5,
                tipo_entrega = $6,
                sku = $7,
                precio_centavos = $8,
                moneda = $9,
                actualizado_en = $10
          WHERE id = $1 AND vendedor_id = $2
          RETURNING id`,
        [
          productoId,
          sellerId,
          datos.nombre,
          datos.descripcion,
          datos.categoria,
          datos.tipoEntrega,
          datos.sku,
          datos.precioCentavos,
          datos.moneda,
          now
        ]
      );
      if (result.rowCount === 0) {
        return null;
      }
      return this.loadProduct(this.pool, sellerId, productoId);
    } catch (error) {
      throw writeError(error);
    }
  }

  async updateProductState(
    sellerId: string,
    productoId: string,
    expected: EstadoProductoVendedor,
    next: EstadoProductoVendedor,
    now: string
  ): Promise<SellerProductView | null> {
    try {
      const result = await this.pool.query<{ id: string }>(
        `UPDATE products
            SET estado = $4, actualizado_en = $5
          WHERE id = $1 AND vendedor_id = $2 AND estado = $3
          RETURNING id`,
        [productoId, sellerId, expected, next, now]
      );
      if (result.rowCount === 0) {
        const exists = await this.pool.query(
          "SELECT 1 FROM products WHERE id = $1 AND vendedor_id = $2",
          [productoId, sellerId]
        );
        if (exists.rowCount === 0) {
          return null;
        }
        throw new BusinessRuleError(
          "El producto cambió de estado mientras se procesaba la solicitud.",
          { motivo: "CONFLICTO_ESTADO" }
        );
      }
      return this.loadProduct(this.pool, sellerId, productoId);
    } catch (error) {
      throw writeError(error);
    }
  }

  async addProductImage(record: AddImageRecord): Promise<SellerProductView | null> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      const owner = await client.query(
        `SELECT 1 FROM products WHERE id = $1 AND vendedor_id = $2 FOR UPDATE`,
        [record.productoId, record.vendedorId]
      );
      if (owner.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      const next = await client.query<{ orden: number }>(
        `SELECT COALESCE(MAX(orden), -1) + 1 AS orden
           FROM product_images
          WHERE producto_id = $1`,
        [record.productoId]
      );
      await client.query(
        `INSERT INTO product_images (id, producto_id, url, alt, orden, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          record.id,
          record.productoId,
          record.url,
          record.alt,
          next.rows[0]?.orden ?? 0,
          record.creadoEn
        ]
      );
      const product = await this.loadProduct(client, record.vendedorId, record.productoId);
      await client.query("COMMIT");
      return product;
    } catch (error) {
      await rollback(client);
      throw writeError(error);
    } finally {
      client.release();
    }
  }

  async removeProductImage(
    sellerId: string,
    productoId: string,
    imageId: string
  ): Promise<SellerProductView | null> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      const owner = await client.query(
        `SELECT 1 FROM products WHERE id = $1 AND vendedor_id = $2 FOR UPDATE`,
        [productoId, sellerId]
      );
      if (owner.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      const removed = await client.query(
        `DELETE FROM product_images WHERE id = $1 AND producto_id = $2`,
        [imageId, productoId]
      );
      if (removed.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      const product = await this.loadProduct(client, sellerId, productoId);
      await client.query("COMMIT");
      return product;
    } catch (error) {
      await rollback(client);
      throw writeError(error);
    } finally {
      client.release();
    }
  }

  async listWarehouses(sellerId: string): Promise<SellerWarehouseView[]> {
    try {
      const result = await this.pool.query<WarehouseRow>(
        `SELECT id, vendedor_id, nombre, ubicacion, estado, creada_en
           FROM warehouses
          WHERE vendedor_id = $1 AND tipo = 'VENDEDOR'
          ORDER BY creada_en ASC, id ASC`,
        [sellerId]
      );
      return result.rows.map(toWarehouse);
    } catch (error) {
      throw readError(error);
    }
  }

  async createWarehouse(record: CreateWarehouseRecord): Promise<SellerWarehouseView> {
    try {
      const result = await this.pool.query<WarehouseRow>(
        `INSERT INTO warehouses (
           id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en
         ) VALUES ($1, $2, $3, $4, 'VENDEDOR', 'ACTIVA', $5)
         RETURNING id, vendedor_id, nombre, ubicacion, estado, creada_en`,
        [record.id, record.vendedorId, record.nombre, record.ubicacion, record.creadaEn]
      );
      const row = result.rows[0];
      if (!row) {
        throw new DependencyUnavailableError("La bodega no pudo crearse.");
      }
      return toWarehouse(row);
    } catch (error) {
      throw writeError(error);
    }
  }

  async updateWarehouse(
    sellerId: string,
    warehouseId: string,
    changes: WarehouseChanges
  ): Promise<SellerWarehouseView | null> {
    try {
      const result = await this.pool.query<WarehouseRow>(
        `UPDATE warehouses
            SET nombre = COALESCE($3, nombre),
                ubicacion = COALESCE($4, ubicacion)
          WHERE id = $1 AND vendedor_id = $2 AND tipo = 'VENDEDOR'
          RETURNING id, vendedor_id, nombre, ubicacion, estado, creada_en`,
        [warehouseId, sellerId, changes.nombre ?? null, changes.ubicacion ?? null]
      );
      const row = result.rows[0];
      return row ? toWarehouse(row) : null;
    } catch (error) {
      throw writeError(error);
    }
  }

  async listInventory(sellerId: string): Promise<SellerInventoryView[]> {
    try {
      const result = await this.pool.query<InventoryRow>(
        `SELECT i.producto_id, p.nombre AS producto_nombre, p.sku,
                i.bodega_id, w.nombre AS bodega_nombre,
                i.on_hand, i.reserved, i.unavailable, i.actualizado_en
           FROM inventory i
           JOIN products p ON p.id = i.producto_id
           JOIN warehouses w ON w.id = i.bodega_id
          WHERE p.vendedor_id = $1 AND w.vendedor_id = $1
          ORDER BY p.nombre ASC, w.nombre ASC`,
        [sellerId]
      );
      return result.rows.map(toInventory);
    } catch (error) {
      throw readError(error);
    }
  }

  async registerIngress(command: IngressCommand): Promise<IngressResult> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1)::bigint)", [
        `seller-ingress:${command.vendedorId}:${command.idempotencyKey}`
      ]);

      const seller = await client.query<{ estado: SellerProfileView["estado"] }>(
        "SELECT estado FROM sellers WHERE id = $1",
        [command.vendedorId]
      );
      if (!seller.rows[0]) {
        throw new ResourceNotFoundError("El perfil de vendedor no existe.");
      }
      if (seller.rows[0].estado !== "ACTIVO") {
        throw new AuthorizationError(
          "El perfil de vendedor no está activo para registrar inventario."
        );
      }

      const product = await client.query<{
        id: string;
        nombre: string;
        sku: string;
        tipo_entrega: TipoEntregaVendedor;
        estado: EstadoProductoVendedor;
      }>(
        `SELECT id, nombre, sku, tipo_entrega, estado
           FROM products
          WHERE id = $1 AND vendedor_id = $2
          FOR UPDATE`,
        [command.productoId, command.vendedorId]
      );
      const productRow = product.rows[0];
      if (!productRow) {
        throw new ResourceNotFoundError(
          "El producto no existe o no pertenece a tu catálogo."
        );
      }
      assertProductoFisico(productRow.tipo_entrega);
      assertProductoConInventario(productRow.estado);

      const warehouse = await client.query<{
        id: string;
        nombre: string;
        estado: SellerWarehouseView["estado"];
      }>(
        `SELECT id, nombre, estado
           FROM warehouses
          WHERE id = $1 AND vendedor_id = $2 AND tipo = 'VENDEDOR'
          FOR UPDATE`,
        [command.bodegaId, command.vendedorId]
      );
      const warehouseRow = warehouse.rows[0];
      if (!warehouseRow) {
        throw new ResourceNotFoundError(
          "La bodega no existe o no pertenece a tu operación."
        );
      }
      assertBodegaActiva(warehouseRow.estado);

      const existing = await client.query<{ id: string }>(
        `SELECT id FROM inventory_movements
          WHERE vendedor_id = $1 AND idempotency_key = $2`,
        [command.vendedorId, command.idempotencyKey]
      );
      if (existing.rows[0]) {
        const position = await this.loadInventoryPosition(
          client,
          command.vendedorId,
          command.productoId,
          command.bodegaId
        );
        if (position === null) {
          throw new DependencyUnavailableError(
            "La posición de inventario del movimiento no pudo recuperarse."
          );
        }
        await client.query("COMMIT");
        return {
          movimientoId: existing.rows[0].id,
          duplicado: true,
          posicion: position
        };
      }

      const upsert = await client.query<{
        id: string;
        on_hand: number;
        reserved: number;
        unavailable: number;
        actualizado_en: Date;
      }>(
        `INSERT INTO inventory (
           id, producto_id, bodega_id, on_hand, reserved, unavailable,
           version, actualizado_en
         ) VALUES ($1, $2, $3, $4, 0, 0, 1, $5)
         ON CONFLICT (producto_id, bodega_id)
         DO UPDATE SET on_hand = inventory.on_hand + EXCLUDED.on_hand,
                       version = inventory.version + 1,
                       actualizado_en = EXCLUDED.actualizado_en
         RETURNING id, on_hand, reserved, unavailable, actualizado_en`,
        [
          command.inventarioId,
          command.productoId,
          command.bodegaId,
          command.cantidad,
          command.now
        ]
      );
      const position = upsert.rows[0];
      if (!position) {
        throw new DependencyUnavailableError(
          "La posición de inventario no pudo actualizarse."
        );
      }

      await client.query(
        `INSERT INTO inventory_movements (
           id, inventario_id, producto_id, bodega_id, vendedor_id, tipo,
           cantidad, referencia_tipo, referencia_id, actor_id, motivo,
           ocurrido_en, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, 'INGRESO', $6, 'INGRESO', $7, $8, $9, $10, $11)`,
        [
          command.movimientoId,
          position.id,
          command.productoId,
          command.bodegaId,
          command.vendedorId,
          command.cantidad,
          command.idempotencyKey,
          command.actorId,
          command.motivo,
          command.now,
          command.idempotencyKey
        ]
      );

      await client.query("COMMIT");
      return {
        movimientoId: command.movimientoId,
        duplicado: false,
        posicion: {
          productoId: command.productoId,
          productoNombre: productRow.nombre,
          sku: productRow.sku,
          bodegaId: command.bodegaId,
          bodegaNombre: warehouseRow.nombre,
          onHand: position.on_hand,
          reserved: position.reserved,
          unavailable: position.unavailable,
          disponible: position.on_hand - position.reserved - position.unavailable,
          actualizadoEn: position.actualizado_en.toISOString()
        }
      };
    } catch (error) {
      await rollback(client);
      throw ingressError(error);
    } finally {
      client.release();
    }
  }

  async listOrders(sellerId: string): Promise<SellerOrderSummary[]> {
    try {
      const result = await this.pool.query<OrderRow>(
        `SELECT o.id, o.numero, o.estado, o.estado_pago, o.moneda,
                o.total_centavos, COUNT(oi.id)::int AS items_count, o.creado_en
           FROM orders o
           LEFT JOIN order_items oi ON oi.pedido_id = o.id
          WHERE o.vendedor_id = $1
          GROUP BY o.id
          ORDER BY o.creado_en DESC, o.id DESC`,
        [sellerId]
      );
      return result.rows.map(toOrderSummary);
    } catch (error) {
      throw readError(error);
    }
  }

  async findOrder(
    sellerId: string,
    orderId: string
  ): Promise<SellerOrderDetail | null> {
    try {
      const order = await this.pool.query<OrderRow>(
        `SELECT o.id, o.numero, o.estado, o.estado_pago, o.moneda,
                o.total_centavos, COUNT(oi.id)::int AS items_count, o.creado_en
           FROM orders o
           LEFT JOIN order_items oi ON oi.pedido_id = o.id
          WHERE o.id = $1 AND o.vendedor_id = $2
          GROUP BY o.id`,
        [orderId, sellerId]
      );
      const row = order.rows[0];
      if (!row) {
        return null;
      }
      const items = await this.pool.query<OrderItemRow>(
        `SELECT id, producto_id, nombre_producto, sku, tipo_entrega, cantidad,
                precio_unitario_centavos, moneda, subtotal_centavos
           FROM order_items
          WHERE pedido_id = $1
          ORDER BY nombre_producto ASC, id ASC`,
        [orderId]
      );
      return {
        ...toOrderSummary(row),
        items: items.rows.map(toOrderItem)
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible comprobar la base de datos del vendedor.",
        { cause: messageOf(error) }
      );
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async loadProduct(
    db: Db,
    sellerId: string,
    productoId: string
  ): Promise<SellerProductView | null> {
    try {
      const result = await db.query<ProductRow>(
        `${PRODUCT_SELECT} WHERE p.vendedor_id = $1 AND p.id = $2`,
        [sellerId, productoId]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const images = await this.loadImages(db, [productoId]);
      return toProduct(row, images.get(productoId) ?? []);
    } catch (error) {
      throw readError(error);
    }
  }

  private async loadImages(
    db: Db,
    productIds: readonly string[]
  ): Promise<Map<string, ImagenProductoVendedor[]>> {
    const grouped = new Map<string, ImagenProductoVendedor[]>();
    if (productIds.length === 0) {
      return grouped;
    }
    const result = await db.query<ImageRow>(
      `SELECT id, producto_id, url, alt, orden
         FROM product_images
        WHERE producto_id = ANY($1::uuid[])
        ORDER BY producto_id ASC, orden ASC`,
      [productIds]
    );
    for (const row of result.rows) {
      const current = grouped.get(row.producto_id) ?? [];
      current.push({ id: row.id, url: row.url, alt: row.alt, orden: row.orden });
      grouped.set(row.producto_id, current);
    }
    return grouped;
  }

  private async loadInventoryPosition(
    db: Db,
    sellerId: string,
    productoId: string,
    bodegaId: string
  ): Promise<SellerInventoryView | null> {
    const result = await db.query<InventoryRow>(
      `SELECT i.producto_id, p.nombre AS producto_nombre, p.sku,
              i.bodega_id, w.nombre AS bodega_nombre,
              i.on_hand, i.reserved, i.unavailable, i.actualizado_en
         FROM inventory i
         JOIN products p ON p.id = i.producto_id
         JOIN warehouses w ON w.id = i.bodega_id
        WHERE i.producto_id = $1 AND i.bodega_id = $2
          AND p.vendedor_id = $3 AND w.vendedor_id = $3`,
      [productoId, bodegaId, sellerId]
    );
    const row = result.rows[0];
    return row ? toInventory(row) : null;
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

function toProfile(row: ProfileRow): SellerProfileView {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nombreComercial: row.nombre_comercial,
    estado: row.estado,
    creadoEn: row.creado_en.toISOString(),
    nombreCompleto: row.nombre_completo,
    correoElectronico: row.correo_normalizado
  };
}

function toProduct(
  row: ProductRow,
  imagenes: readonly ImagenProductoVendedor[]
): SellerProductView {
  const onHand = row.on_hand ?? 0;
  const reserved = row.reserved ?? 0;
  const unavailable = row.unavailable ?? 0;
  return {
    id: row.id,
    vendedorId: row.vendedor_id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    categoria: row.categoria,
    tipoEntrega: row.tipo_entrega,
    sku: row.sku,
    precioCentavos: toInteger(row.precio_centavos),
    moneda: row.moneda.trim(),
    estado: row.estado,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString(),
    imagenes,
    inventario:
      row.tipo_entrega === "FISICA"
        ? {
            onHand,
            reserved,
            unavailable,
            disponible: onHand - reserved - unavailable
          }
        : null
  };
}

function toWarehouse(row: WarehouseRow): SellerWarehouseView {
  return {
    id: row.id,
    vendedorId: row.vendedor_id,
    nombre: row.nombre,
    ubicacion: row.ubicacion,
    estado: row.estado,
    creadaEn: row.creada_en.toISOString()
  };
}

function toInventory(row: InventoryRow): SellerInventoryView {
  return {
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sku: row.sku,
    bodegaId: row.bodega_id,
    bodegaNombre: row.bodega_nombre,
    onHand: row.on_hand,
    reserved: row.reserved,
    unavailable: row.unavailable,
    disponible: row.on_hand - row.reserved - row.unavailable,
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toOrderSummary(row: OrderRow): SellerOrderSummary {
  return {
    id: row.id,
    numero: row.numero,
    estado: row.estado,
    estadoPago: row.estado_pago,
    moneda: row.moneda.trim(),
    totalCentavos: toInteger(row.total_centavos),
    itemsCount: row.items_count,
    creadoEn: row.creado_en.toISOString()
  };
}

function toOrderItem(row: OrderItemRow): SellerOrderItemView {
  return {
    id: row.id,
    productoId: row.producto_id,
    nombreProducto: row.nombre_producto,
    sku: row.sku,
    tipoEntrega: row.tipo_entrega,
    cantidad: row.cantidad,
    precioUnitarioCentavos: toInteger(row.precio_unitario_centavos),
    moneda: row.moneda.trim(),
    subtotalCentavos: toInteger(row.subtotal_centavos)
  };
}

function toInteger(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "error desconocido";
}

function readError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  return new DependencyUnavailableError("No fue posible consultar el espacio del vendedor.", {
    cause: messageOf(error)
  });
}

function writeError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  if (isPgError(error, "23505")) {
    return new UniquenessConflictError(
      "El SKU ya está en uso. Usa un identificador comercial distinto.",
      { motivo: "SKU_DUPLICADO" }
    );
  }
  return new DependencyUnavailableError("No fue posible guardar el cambio del vendedor.", {
    cause: messageOf(error)
  });
}

function ingressError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  if (isPgError(error, "23505")) {
    return new BusinessRuleError(
      "La clave de idempotencia ya fue utilizada para otro ingreso.",
      { motivo: "IDEMPOTENCIA_DUPLICADA" }
    );
  }
  if (isPgError(error, "23503") || isPgError(error, "23514")) {
    return new BusinessRuleError(
      "El ingreso de inventario incumple una restricción de la base de datos.",
      { motivo: "INVENTARIO_INVALIDO" }
    );
  }
  return new DependencyUnavailableError(
    "No fue posible registrar el ingreso de inventario.",
    { cause: messageOf(error) }
  );
}

function isPgError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Se informa el error original.
  }
}
