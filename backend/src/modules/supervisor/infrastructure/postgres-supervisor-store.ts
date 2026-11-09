import { Pool } from "pg";
import {
  ApplicationError,
  DependencyUnavailableError
} from "../../../shared/domain/errors.js";
import type { EstadoEnvio } from "../../logistics/domain/envio.js";
import type { EstadoPago, EstadoPedido } from "../../orders/application/ports.js";
import type {
  EstadoProductoVendedor,
  TipoEntregaVendedor
} from "../../seller-workspace/domain/producto-vendedor.js";
import type { EstadoVendedor } from "../../seller-workspace/application/ports.js";
import {
  type SupervisorDashboardView,
  type SupervisorHistoryView,
  type SupervisorInventoryFilter,
  type SupervisorInventoryView,
  type SupervisorOrderDetail,
  type SupervisorOrderFilter,
  type SupervisorOrderItemView,
  type SupervisorOrderSummary,
  type SupervisorPage,
  type SupervisorPaymentView,
  type SupervisorProductDetail,
  type SupervisorProductFilter,
  type SupervisorProductImageView,
  type SupervisorProductInventoryView,
  type SupervisorProductSummary,
  type SupervisorReservationView,
  type SupervisorSellerFilter,
  type SupervisorSellerView,
  type SupervisorShipmentFilter,
  type SupervisorShipmentItemView,
  type SupervisorShipmentSummary,
  type SupervisorShipmentView,
  type SupervisorStore,
  type SupervisorWarehouseView
} from "../application/ports.js";

/**
 * Adaptador PostgreSQL de solo lectura del Supervisor.
 *
 * Todas las sentencias son `SELECT`. No se reutilizan los almacenes de vendedor
 * ni de logística porque ambos aplican un ámbito obligatorio (`sellerId` /
 * `operadorId`) que el Supervisor no posee. Las consultas respetan la
 * minimización de datos: no se leen correos, documentos, teléfonos ni
 * direcciones de entrega.
 */

interface OrderRow {
  id: string;
  numero: string;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  moneda: string;
  total_centavos: string | number;
  items_count: number;
  vendedor_id: string;
  vendedor_nombre: string;
  creado_en: Date;
  actualizado_en: Date;
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

interface PaymentRow {
  estado: EstadoPago;
  proveedor: string;
  monto_centavos: string | number;
  moneda: string;
  creado_en: Date;
  actualizado_en: Date;
}

interface ReservationRow {
  id: string;
  producto_id: string;
  producto_nombre: string;
  sku: string;
  bodega_id: string;
  bodega_nombre: string;
  cantidad: number;
  estado: SupervisorReservationView["estado"];
  creada_en: Date;
}

interface ShipmentRow {
  id: string;
  pedido_id: string;
  bodega_origen_id: string;
  bodega_nombre: string;
  transportista: string | null;
  tracking_number: string | null;
  estado: EstadoEnvio;
  creado_en: Date;
  despachado_en: Date | null;
  entregado_en: Date | null;
}

interface ShipmentItemRow {
  envio_id: string;
  producto_id: string;
  nombre_producto: string;
  sku: string;
  cantidad: number;
}

interface EvidenceRow {
  envio_id: string;
  tipo: string;
  referencia: string;
  nota: string | null;
  registrada_en: Date;
}

interface HistoryRow {
  estado_previo: EstadoPedido | null;
  estado_nuevo: EstadoPedido;
  actor_rol: string | null;
  ocurrido_en: Date;
  referencia_tipo: string;
  referencia_id: string;
  correlation_id: string;
}

interface ProductRow {
  id: string;
  vendedor_id: string;
  vendedor_nombre: string;
  nombre: string;
  sku: string;
  categoria: SupervisorProductSummary["categoria"];
  estado: EstadoProductoVendedor;
  tipo_entrega: TipoEntregaVendedor;
  precio_centavos: string | number;
  moneda: string;
  imagenes_count: number;
  inventario_disponible: number | null;
  creado_en: Date;
  actualizado_en: Date;
}

interface ProductDetailRow extends ProductRow {
  descripcion: string;
}

interface ProductImageRow {
  id: string;
  url: string;
  alt: string;
  orden: number;
}

interface ProductInventoryRow {
  bodega_id: string;
  bodega_nombre: string;
  on_hand: number;
  reserved: number;
  unavailable: number;
  actualizado_en: Date;
}

interface WarehouseRow {
  id: string;
  nombre: string;
  ubicacion: string;
  tipo: SupervisorWarehouseView["tipo"];
  estado: SupervisorWarehouseView["estado"];
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  creada_en: Date;
}

interface InventoryRow {
  producto_id: string;
  producto_nombre: string;
  sku: string;
  bodega_id: string;
  bodega_nombre: string;
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  on_hand: number;
  reserved: number;
  unavailable: number;
  actualizado_en: Date;
}

interface ShipmentSummaryRow {
  id: string;
  pedido_id: string;
  pedido_numero: string;
  bodega_origen_id: string;
  bodega_nombre: string;
  transportista: string | null;
  tracking_number: string | null;
  estado: EstadoEnvio;
  creado_en: Date;
  despachado_en: Date | null;
  entregado_en: Date | null;
}

interface SellerRow {
  id: string;
  nombre_comercial: string;
  estado: EstadoVendedor;
  creado_en: Date;
  productos_count: number;
  productos_publicados_count: number;
  bodegas_count: number;
  inventario_disponible: number;
}

interface CountRow {
  total: number;
}

interface DashboardRow {
  pedidos_total: number;
  pedidos_pendiente_de_pago: number;
  pedidos_pagado: number;
  pedidos_en_preparacion: number;
  pedidos_despachado: number;
  pedidos_entregado: number;
  pedidos_cancelado: number;
  pedidos_cerrado: number;
  pagos_pendiente: number;
  pagos_autorizado: number;
  pagos_capturado: number;
  pagos_rechazado: number;
  pagos_cancelado: number;
  pagos_reembolso_parcial: number;
  pagos_reembolsado: number;
  productos_total: number;
  productos_borrador: number;
  productos_publicado: number;
  productos_suspendido: number;
  productos_descontinuado: number;
  inventario_posiciones: number;
  inventario_on_hand: number;
  inventario_reserved: number;
  inventario_unavailable: number;
  inventario_disponible: number;
  almacenes_total: number;
  almacenes_activa: number;
  almacenes_inactiva: number;
  envios_total: number;
  envios_preparacion: number;
  envios_empacado: number;
  envios_despachado: number;
  envios_en_transito: number;
  envios_entregado: number;
  envios_fallido: number;
  envios_devuelto: number;
  vendedores_total: number;
  vendedores_en_revision: number;
  vendedores_activo: number;
  vendedores_suspendido: number;
  vendedores_inactivo: number;
  operadores_total: number;
  operadores_activo: number;
  operadores_inactivo: number;
  compradores_total: number;
  compradores_habilitado: number;
  compradores_restringido: number;
}

const ORDER_SELECT = `
  SELECT o.id, o.numero, o.estado, o.estado_pago, o.moneda, o.total_centavos,
         o.vendedor_id, s.nombre_comercial AS vendedor_nombre,
         o.creado_en, o.actualizado_en,
         COUNT(oi.id)::int AS items_count
    FROM orders o
    JOIN sellers s ON s.id = o.vendedor_id
    LEFT JOIN order_items oi ON oi.pedido_id = o.id
`;

const PRODUCT_SELECT = `
  SELECT p.id, p.vendedor_id, s.nombre_comercial AS vendedor_nombre,
         p.nombre, p.sku, p.categoria, p.estado, p.tipo_entrega,
         p.precio_centavos, p.moneda, p.creado_en, p.actualizado_en,
         (SELECT COUNT(*)::int
            FROM product_images pi
           WHERE pi.producto_id = p.id) AS imagenes_count,
         CASE WHEN p.tipo_entrega = 'DIGITAL' THEN NULL
              ELSE COALESCE((
                SELECT SUM(i.on_hand - i.reserved - i.unavailable)::int
                  FROM inventory i
                 WHERE i.producto_id = p.id
              ), 0)
         END AS inventario_disponible
    FROM products p
    JOIN sellers s ON s.id = p.vendedor_id
`;

export class PostgresSupervisorStore implements SupervisorStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async dashboard(): Promise<SupervisorDashboardView> {
    try {
      const result = await this.pool.query<DashboardRow>(DASHBOARD_SELECT);
      const row = result.rows[0];
      if (!row) {
        return emptyDashboard();
      }
      return {
        pedidosTotal: row.pedidos_total,
        pedidosPorEstado: {
          PENDIENTE_DE_PAGO: row.pedidos_pendiente_de_pago,
          PAGADO: row.pedidos_pagado,
          EN_PREPARACION: row.pedidos_en_preparacion,
          DESPACHADO: row.pedidos_despachado,
          ENTREGADO: row.pedidos_entregado,
          CANCELADO: row.pedidos_cancelado,
          CERRADO: row.pedidos_cerrado
        },
        pagosPorEstado: {
          PENDIENTE: row.pagos_pendiente,
          AUTORIZADO: row.pagos_autorizado,
          CAPTURADO: row.pagos_capturado,
          RECHAZADO: row.pagos_rechazado,
          CANCELADO: row.pagos_cancelado,
          REEMBOLSO_PARCIAL: row.pagos_reembolso_parcial,
          REEMBOLSADO: row.pagos_reembolsado
        },
        productosTotal: row.productos_total,
        productosPorEstado: {
          BORRADOR: row.productos_borrador,
          PUBLICADO: row.productos_publicado,
          SUSPENDIDO: row.productos_suspendido,
          DESCONTINUADO: row.productos_descontinuado
        },
        inventario: {
          posiciones: row.inventario_posiciones,
          onHand: row.inventario_on_hand,
          reserved: row.inventario_reserved,
          unavailable: row.inventario_unavailable,
          disponible: row.inventario_disponible
        },
        almacenesTotal: row.almacenes_total,
        almacenesPorEstado: {
          ACTIVA: row.almacenes_activa,
          INACTIVA: row.almacenes_inactiva
        },
        enviosTotal: row.envios_total,
        enviosPorEstado: {
          PREPARACION: row.envios_preparacion,
          EMPACADO: row.envios_empacado,
          DESPACHADO: row.envios_despachado,
          EN_TRANSITO: row.envios_en_transito,
          ENTREGADO: row.envios_entregado,
          FALLIDO: row.envios_fallido,
          DEVUELTO: row.envios_devuelto
        },
        vendedoresTotal: row.vendedores_total,
        vendedoresPorEstado: {
          EN_REVISION: row.vendedores_en_revision,
          ACTIVO: row.vendedores_activo,
          SUSPENDIDO: row.vendedores_suspendido,
          INACTIVO: row.vendedores_inactivo
        },
        operadoresLogisticosTotal: row.operadores_total,
        operadoresLogisticosPorEstado: {
          ACTIVO: row.operadores_activo,
          INACTIVO: row.operadores_inactivo
        },
        compradoresTotal: row.compradores_total,
        compradoresPorEstado: {
          HABILITADO: row.compradores_habilitado,
          RESTRINGIDO: row.compradores_restringido
        }
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listOrders(
    filter: SupervisorOrderFilter
  ): Promise<SupervisorPage<SupervisorOrderSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM orders o
          WHERE ($1::text IS NULL OR o.estado = $1)`,
        [filter.estado]
      );
      const result = await this.pool.query<OrderRow>(
        `${ORDER_SELECT}
          WHERE ($1::text IS NULL OR o.estado = $1)
          GROUP BY o.id, s.nombre_comercial
          ORDER BY o.creado_en DESC, o.id DESC
          LIMIT $2 OFFSET $3`,
        [filter.estado, filter.pageSize, offsetOf(filter.page, filter.pageSize)]
      );
      return pageOf(result.rows.map(toOrderSummary), count.rows[0]?.total ?? 0, filter);
    } catch (error) {
      throw readError(error);
    }
  }

  async findOrder(orderId: string): Promise<SupervisorOrderDetail | null> {
    try {
      const order = await this.pool.query<OrderRow>(
        `${ORDER_SELECT}
          WHERE o.id = $1
          GROUP BY o.id, s.nombre_comercial
          LIMIT 1`,
        [orderId]
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
      const payment = await this.pool.query<PaymentRow>(
        `SELECT estado, proveedor, monto_centavos, moneda, creado_en, actualizado_en
           FROM payments
          WHERE pedido_id = $1
          ORDER BY creado_en DESC, id DESC
          LIMIT 1`,
        [orderId]
      );
      const reservations = await this.pool.query<ReservationRow>(
        `SELECT r.id, r.producto_id, p.nombre AS producto_nombre, p.sku,
                r.bodega_id, w.nombre AS bodega_nombre, r.cantidad, r.estado,
                r.creada_en
           FROM inventory_reservations r
           JOIN products p ON p.id = r.producto_id
           JOIN warehouses w ON w.id = r.bodega_id
          WHERE r.pedido_id = $1
          ORDER BY r.creada_en ASC, r.id ASC`,
        [orderId]
      );
      const shipments = await this.pool.query<ShipmentRow>(
        `SELECT sh.id, sh.pedido_id, sh.bodega_origen_id, w.nombre AS bodega_nombre,
                sh.transportista, sh.tracking_number, sh.estado, sh.creado_en,
                sh.despachado_en, sh.entregado_en
           FROM shipments sh
           JOIN warehouses w ON w.id = sh.bodega_origen_id
          WHERE sh.pedido_id = $1
          ORDER BY sh.creado_en ASC, sh.id ASC`,
        [orderId]
      );

      const shipmentIds = shipments.rows.map((shipment) => shipment.id);
      let shipmentItems: ShipmentItemRow[] = [];
      let evidence: EvidenceRow[] = [];
      if (shipmentIds.length > 0) {
        const itemResult = await this.pool.query<ShipmentItemRow>(
          `SELECT si.envio_id, si.producto_id, p.nombre AS nombre_producto, p.sku,
                  si.cantidad
             FROM shipment_items si
             JOIN products p ON p.id = si.producto_id
            WHERE si.envio_id = ANY($1::uuid[])
            ORDER BY p.nombre ASC`,
          [shipmentIds]
        );
        shipmentItems = itemResult.rows;
        const evidenceResult = await this.pool.query<EvidenceRow>(
          `SELECT DISTINCT ON (envio_id)
                  envio_id, tipo, referencia, nota, registrada_en
             FROM delivery_evidence
            WHERE envio_id = ANY($1::uuid[])
            ORDER BY envio_id, registrada_en DESC, id DESC`,
          [shipmentIds]
        );
        evidence = evidenceResult.rows;
      }

      const history = await this.pool.query<HistoryRow>(
        `SELECT estado_previo, estado_nuevo, actor_rol, ocurrido_en,
                referencia_tipo, referencia_id, correlation_id
           FROM order_status_history
          WHERE pedido_id = $1
          ORDER BY ocurrido_en ASC, id ASC`,
        [orderId]
      );

      const itemsByShipment = groupShipmentItems(shipmentItems);
      const evidenceByShipment = new Map(
        evidence.map((entry) => [entry.envio_id, entry])
      );

      return {
        ...toOrderSummary(row),
        items: items.rows.map(toOrderItem),
        pago: payment.rows[0] ? toPayment(payment.rows[0]) : null,
        reservas: reservations.rows.map(toReservation),
        envios: shipments.rows.map((shipment) =>
          toShipmentView(
            shipment,
            itemsByShipment.get(shipment.id) ?? [],
            evidenceByShipment.get(shipment.id) ?? null
          )
        ),
        historial: history.rows.map(toHistory)
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listProducts(
    filter: SupervisorProductFilter
  ): Promise<SupervisorPage<SupervisorProductSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM products p
          WHERE ($1::text IS NULL OR p.estado = $1)
            AND ($2::text IS NULL OR p.categoria = $2)
            AND ($3::uuid IS NULL OR p.vendedor_id = $3)`,
        [filter.estado, filter.categoria, filter.vendedorId]
      );
      const result = await this.pool.query<ProductRow>(
        `${PRODUCT_SELECT}
          WHERE ($1::text IS NULL OR p.estado = $1)
            AND ($2::text IS NULL OR p.categoria = $2)
            AND ($3::uuid IS NULL OR p.vendedor_id = $3)
          ORDER BY p.creado_en DESC, p.id DESC
          LIMIT $4 OFFSET $5`,
        [
          filter.estado,
          filter.categoria,
          filter.vendedorId,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(result.rows.map(toProductSummary), count.rows[0]?.total ?? 0, filter);
    } catch (error) {
      throw readError(error);
    }
  }

  async findProduct(productId: string): Promise<SupervisorProductDetail | null> {
    try {
      const product = await this.pool.query<ProductDetailRow>(
        `SELECT p.id, p.vendedor_id, s.nombre_comercial AS vendedor_nombre,
                p.nombre, p.descripcion, p.sku, p.categoria, p.estado,
                p.tipo_entrega, p.precio_centavos, p.moneda, p.creado_en,
                p.actualizado_en,
                (SELECT COUNT(*)::int
                   FROM product_images pi
                  WHERE pi.producto_id = p.id) AS imagenes_count,
                CASE WHEN p.tipo_entrega = 'DIGITAL' THEN NULL
                     ELSE COALESCE((
                       SELECT SUM(i.on_hand - i.reserved - i.unavailable)::int
                         FROM inventory i
                        WHERE i.producto_id = p.id
                     ), 0)
                END AS inventario_disponible
           FROM products p
           JOIN sellers s ON s.id = p.vendedor_id
          WHERE p.id = $1`,
        [productId]
      );
      const row = product.rows[0];
      if (!row) {
        return null;
      }
      const images = await this.pool.query<ProductImageRow>(
        `SELECT id, url, alt, orden
           FROM product_images
          WHERE producto_id = $1
          ORDER BY orden ASC, id ASC`,
        [productId]
      );
      const inventory = await this.pool.query<ProductInventoryRow>(
        `SELECT i.bodega_id, w.nombre AS bodega_nombre, i.on_hand, i.reserved,
                i.unavailable, i.actualizado_en
           FROM inventory i
           JOIN warehouses w ON w.id = i.bodega_id
          WHERE i.producto_id = $1
          ORDER BY w.nombre ASC, w.id ASC`,
        [productId]
      );
      return {
        ...toProductSummary(row),
        descripcion: row.descripcion,
        imagenes: images.rows.map(toProductImage),
        inventario: inventory.rows.map(toProductInventory)
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listWarehouses(): Promise<SupervisorWarehouseView[]> {
    try {
      const result = await this.pool.query<WarehouseRow>(
        `SELECT w.id, w.nombre, w.ubicacion, w.tipo, w.estado, w.vendedor_id,
                s.nombre_comercial AS vendedor_nombre, w.creada_en
           FROM warehouses w
           LEFT JOIN sellers s ON s.id = w.vendedor_id
          ORDER BY w.nombre ASC, w.id ASC`
      );
      return result.rows.map(toWarehouse);
    } catch (error) {
      throw readError(error);
    }
  }

  async listInventory(
    filter: SupervisorInventoryFilter
  ): Promise<SupervisorPage<SupervisorInventoryView>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM inventory i
          WHERE ($1::uuid IS NULL OR i.bodega_id = $1)
            AND ($2::uuid IS NULL OR i.producto_id = $2)`,
        [filter.bodegaId, filter.productoId]
      );
      const result = await this.pool.query<InventoryRow>(
        `SELECT i.producto_id, p.nombre AS producto_nombre, p.sku,
                i.bodega_id, w.nombre AS bodega_nombre,
                w.vendedor_id, s.nombre_comercial AS vendedor_nombre,
                i.on_hand, i.reserved, i.unavailable, i.actualizado_en
           FROM inventory i
           JOIN products p ON p.id = i.producto_id
           JOIN warehouses w ON w.id = i.bodega_id
           LEFT JOIN sellers s ON s.id = w.vendedor_id
          WHERE ($1::uuid IS NULL OR i.bodega_id = $1)
            AND ($2::uuid IS NULL OR i.producto_id = $2)
          ORDER BY w.nombre ASC, p.nombre ASC, i.producto_id ASC
          LIMIT $3 OFFSET $4`,
        [
          filter.bodegaId,
          filter.productoId,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(result.rows.map(toInventory), count.rows[0]?.total ?? 0, filter);
    } catch (error) {
      throw readError(error);
    }
  }

  async listShipments(
    filter: SupervisorShipmentFilter
  ): Promise<SupervisorPage<SupervisorShipmentSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM shipments sh
          WHERE ($1::text IS NULL OR sh.estado = $1)
            AND ($2::uuid IS NULL OR sh.pedido_id = $2)`,
        [filter.estado, filter.pedidoId]
      );
      const result = await this.pool.query<ShipmentSummaryRow>(
        `SELECT sh.id, sh.pedido_id, o.numero AS pedido_numero,
                sh.bodega_origen_id, w.nombre AS bodega_nombre,
                sh.transportista, sh.tracking_number, sh.estado, sh.creado_en,
                sh.despachado_en, sh.entregado_en
           FROM shipments sh
           JOIN orders o ON o.id = sh.pedido_id
           JOIN warehouses w ON w.id = sh.bodega_origen_id
          WHERE ($1::text IS NULL OR sh.estado = $1)
            AND ($2::uuid IS NULL OR sh.pedido_id = $2)
          ORDER BY sh.creado_en DESC, sh.id DESC
          LIMIT $3 OFFSET $4`,
        [
          filter.estado,
          filter.pedidoId,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toShipmentSummary),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async listSellers(
    filter: SupervisorSellerFilter
  ): Promise<SupervisorPage<SupervisorSellerView>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM sellers s
          WHERE ($1::text IS NULL OR s.estado = $1)`,
        [filter.estado]
      );
      const result = await this.pool.query<SellerRow>(
        `SELECT s.id, s.nombre_comercial, s.estado, s.creado_en,
                (SELECT COUNT(*)::int
                   FROM products p
                  WHERE p.vendedor_id = s.id) AS productos_count,
                (SELECT COUNT(*)::int
                   FROM products p
                  WHERE p.vendedor_id = s.id
                    AND p.estado = 'PUBLICADO') AS productos_publicados_count,
                (SELECT COUNT(*)::int
                   FROM warehouses w
                  WHERE w.vendedor_id = s.id) AS bodegas_count,
                COALESCE((
                  SELECT SUM(i.on_hand - i.reserved - i.unavailable)::int
                    FROM inventory i
                    JOIN warehouses w ON w.id = i.bodega_id
                   WHERE w.vendedor_id = s.id
                ), 0) AS inventario_disponible
           FROM sellers s
          WHERE ($1::text IS NULL OR s.estado = $1)
          ORDER BY s.nombre_comercial ASC, s.id ASC
          LIMIT $2 OFFSET $3`,
        [filter.estado, filter.pageSize, offsetOf(filter.page, filter.pageSize)]
      );
      return pageOf(result.rows.map(toSeller), count.rows[0]?.total ?? 0, filter);
    } catch (error) {
      throw readError(error);
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible comprobar la base de datos de supervisión.",
        { cause: messageOf(error) }
      );
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

const DASHBOARD_SELECT = `
  SELECT
    (SELECT COUNT(*)::int FROM orders) AS pedidos_total,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'PENDIENTE_DE_PAGO') AS pedidos_pendiente_de_pago,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'PAGADO') AS pedidos_pagado,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'EN_PREPARACION') AS pedidos_en_preparacion,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'DESPACHADO') AS pedidos_despachado,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'ENTREGADO') AS pedidos_entregado,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'CANCELADO') AS pedidos_cancelado,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'CERRADO') AS pedidos_cerrado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'PENDIENTE') AS pagos_pendiente,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'AUTORIZADO') AS pagos_autorizado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'CAPTURADO') AS pagos_capturado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'RECHAZADO') AS pagos_rechazado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'CANCELADO') AS pagos_cancelado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'REEMBOLSO_PARCIAL') AS pagos_reembolso_parcial,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'REEMBOLSADO') AS pagos_reembolsado,
    (SELECT COUNT(*)::int FROM products) AS productos_total,
    (SELECT COUNT(*)::int FROM products WHERE estado = 'BORRADOR') AS productos_borrador,
    (SELECT COUNT(*)::int FROM products WHERE estado = 'PUBLICADO') AS productos_publicado,
    (SELECT COUNT(*)::int FROM products WHERE estado = 'SUSPENDIDO') AS productos_suspendido,
    (SELECT COUNT(*)::int FROM products WHERE estado = 'DESCONTINUADO') AS productos_descontinuado,
    (SELECT COUNT(*)::int FROM inventory) AS inventario_posiciones,
    (SELECT COALESCE(SUM(on_hand), 0)::int FROM inventory) AS inventario_on_hand,
    (SELECT COALESCE(SUM(reserved), 0)::int FROM inventory) AS inventario_reserved,
    (SELECT COALESCE(SUM(unavailable), 0)::int FROM inventory) AS inventario_unavailable,
    (SELECT COALESCE(SUM(on_hand - reserved - unavailable), 0)::int FROM inventory) AS inventario_disponible,
    (SELECT COUNT(*)::int FROM warehouses) AS almacenes_total,
    (SELECT COUNT(*)::int FROM warehouses WHERE estado = 'ACTIVA') AS almacenes_activa,
    (SELECT COUNT(*)::int FROM warehouses WHERE estado = 'INACTIVA') AS almacenes_inactiva,
    (SELECT COUNT(*)::int FROM shipments) AS envios_total,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'PREPARACION') AS envios_preparacion,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'EMPACADO') AS envios_empacado,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'DESPACHADO') AS envios_despachado,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'EN_TRANSITO') AS envios_en_transito,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'ENTREGADO') AS envios_entregado,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'FALLIDO') AS envios_fallido,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'DEVUELTO') AS envios_devuelto,
    (SELECT COUNT(*)::int FROM sellers) AS vendedores_total,
    (SELECT COUNT(*)::int FROM sellers WHERE estado = 'EN_REVISION') AS vendedores_en_revision,
    (SELECT COUNT(*)::int FROM sellers WHERE estado = 'ACTIVO') AS vendedores_activo,
    (SELECT COUNT(*)::int FROM sellers WHERE estado = 'SUSPENDIDO') AS vendedores_suspendido,
    (SELECT COUNT(*)::int FROM sellers WHERE estado = 'INACTIVO') AS vendedores_inactivo,
    (SELECT COUNT(*)::int FROM logistics_operators) AS operadores_total,
    (SELECT COUNT(*)::int FROM logistics_operators WHERE estado = 'ACTIVO') AS operadores_activo,
    (SELECT COUNT(*)::int FROM logistics_operators WHERE estado = 'INACTIVO') AS operadores_inactivo,
    (SELECT COUNT(*)::int FROM buyers) AS compradores_total,
    (SELECT COUNT(*)::int FROM buyers WHERE estado_comercial = 'HABILITADO') AS compradores_habilitado,
    (SELECT COUNT(*)::int FROM buyers WHERE estado_comercial = 'RESTRINGIDO') AS compradores_restringido
`;

function offsetOf(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

function pageOf<T>(
  items: readonly T[],
  total: number,
  filter: { readonly page: number; readonly pageSize: number }
): SupervisorPage<T> {
  return { items, total, page: filter.page, pageSize: filter.pageSize };
}

function toInteger(value: string | number): number {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function toOrderSummary(row: OrderRow): SupervisorOrderSummary {
  return {
    id: row.id,
    numero: row.numero,
    estado: row.estado,
    estadoPago: row.estado_pago,
    moneda: row.moneda,
    totalCentavos: toInteger(row.total_centavos),
    itemsCount: row.items_count,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toOrderItem(row: OrderItemRow): SupervisorOrderItemView {
  return {
    id: row.id,
    productoId: row.producto_id,
    nombreProducto: row.nombre_producto,
    sku: row.sku,
    tipoEntrega: row.tipo_entrega,
    cantidad: row.cantidad,
    precioUnitarioCentavos: toInteger(row.precio_unitario_centavos),
    moneda: row.moneda,
    subtotalCentavos: toInteger(row.subtotal_centavos)
  };
}

function toPayment(row: PaymentRow): SupervisorPaymentView {
  return {
    estado: row.estado,
    proveedor: row.proveedor,
    montoCentavos: toInteger(row.monto_centavos),
    moneda: row.moneda,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toReservation(row: ReservationRow): SupervisorReservationView {
  return {
    id: row.id,
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sku: row.sku,
    bodegaId: row.bodega_id,
    bodegaNombre: row.bodega_nombre,
    cantidad: row.cantidad,
    estado: row.estado,
    creadaEn: row.creada_en.toISOString()
  };
}

function groupShipmentItems(
  rows: readonly ShipmentItemRow[]
): Map<string, SupervisorShipmentItemView[]> {
  const grouped = new Map<string, SupervisorShipmentItemView[]>();
  for (const row of rows) {
    const list = grouped.get(row.envio_id) ?? [];
    list.push({
      productoId: row.producto_id,
      nombreProducto: row.nombre_producto,
      sku: row.sku,
      cantidad: row.cantidad
    });
    grouped.set(row.envio_id, list);
  }
  return grouped;
}

function toShipmentView(
  row: ShipmentRow,
  items: readonly SupervisorShipmentItemView[],
  evidence: EvidenceRow | null
): SupervisorShipmentView {
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    bodegaOrigenId: row.bodega_origen_id,
    bodegaNombre: row.bodega_nombre,
    transportista: row.transportista,
    trackingNumber: row.tracking_number,
    estado: row.estado,
    creadoEn: row.creado_en.toISOString(),
    despachadoEn: row.despachado_en?.toISOString() ?? null,
    entregadoEn: row.entregado_en?.toISOString() ?? null,
    items,
    evidencia: evidence
      ? {
          tipo: evidence.tipo,
          referencia: evidence.referencia,
          nota: evidence.nota,
          registradaEn: evidence.registrada_en.toISOString()
        }
      : null
  };
}

function toHistory(row: HistoryRow): SupervisorHistoryView {
  return {
    estadoPrevio: row.estado_previo,
    estadoNuevo: row.estado_nuevo,
    actorRol: row.actor_rol,
    ocurridoEn: row.ocurrido_en.toISOString(),
    referenciaTipo: row.referencia_tipo,
    referenciaId: row.referencia_id,
    correlationId: row.correlation_id
  };
}

function toProductSummary(row: ProductRow): SupervisorProductSummary {
  return {
    id: row.id,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    nombre: row.nombre,
    sku: row.sku,
    categoria: row.categoria,
    estado: row.estado,
    tipoEntrega: row.tipo_entrega,
    precioCentavos: toInteger(row.precio_centavos),
    moneda: row.moneda,
    imagenesCount: row.imagenes_count,
    inventarioDisponible:
      row.inventario_disponible === null ? null : Number(row.inventario_disponible),
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toProductImage(row: ProductImageRow): SupervisorProductImageView {
  return { id: row.id, url: row.url, alt: row.alt, orden: row.orden };
}

function toProductInventory(
  row: ProductInventoryRow
): SupervisorProductInventoryView {
  return {
    bodegaId: row.bodega_id,
    bodegaNombre: row.bodega_nombre,
    onHand: row.on_hand,
    reserved: row.reserved,
    unavailable: row.unavailable,
    disponible: row.on_hand - row.reserved - row.unavailable,
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toWarehouse(row: WarehouseRow): SupervisorWarehouseView {
  return {
    id: row.id,
    nombre: row.nombre,
    ubicacion: row.ubicacion,
    tipo: row.tipo,
    estado: row.estado,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    creadaEn: row.creada_en.toISOString()
  };
}

function toInventory(row: InventoryRow): SupervisorInventoryView {
  return {
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sku: row.sku,
    bodegaId: row.bodega_id,
    bodegaNombre: row.bodega_nombre,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    onHand: row.on_hand,
    reserved: row.reserved,
    unavailable: row.unavailable,
    disponible: row.on_hand - row.reserved - row.unavailable,
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toShipmentSummary(row: ShipmentSummaryRow): SupervisorShipmentSummary {
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    pedidoNumero: row.pedido_numero,
    bodegaOrigenId: row.bodega_origen_id,
    bodegaNombre: row.bodega_nombre,
    transportista: row.transportista,
    trackingNumber: row.tracking_number,
    estado: row.estado,
    creadoEn: row.creado_en.toISOString(),
    despachadoEn: row.despachado_en?.toISOString() ?? null,
    entregadoEn: row.entregado_en?.toISOString() ?? null
  };
}

function toSeller(row: SellerRow): SupervisorSellerView {
  return {
    id: row.id,
    nombreComercial: row.nombre_comercial,
    estado: row.estado,
    creadoEn: row.creado_en.toISOString(),
    productosCount: row.productos_count,
    productosPublicadosCount: row.productos_publicados_count,
    bodegasCount: row.bodegas_count,
    inventarioDisponible: Number(row.inventario_disponible)
  };
}

function emptyDashboard(): SupervisorDashboardView {
  return {
    pedidosTotal: 0,
    pedidosPorEstado: {
      PENDIENTE_DE_PAGO: 0,
      PAGADO: 0,
      EN_PREPARACION: 0,
      DESPACHADO: 0,
      ENTREGADO: 0,
      CANCELADO: 0,
      CERRADO: 0
    },
    pagosPorEstado: {
      PENDIENTE: 0,
      AUTORIZADO: 0,
      CAPTURADO: 0,
      RECHAZADO: 0,
      CANCELADO: 0,
      REEMBOLSO_PARCIAL: 0,
      REEMBOLSADO: 0
    },
    productosTotal: 0,
    productosPorEstado: {
      BORRADOR: 0,
      PUBLICADO: 0,
      SUSPENDIDO: 0,
      DESCONTINUADO: 0
    },
    inventario: {
      posiciones: 0,
      onHand: 0,
      reserved: 0,
      unavailable: 0,
      disponible: 0
    },
    almacenesTotal: 0,
    almacenesPorEstado: { ACTIVA: 0, INACTIVA: 0 },
    enviosTotal: 0,
    enviosPorEstado: {
      PREPARACION: 0,
      EMPACADO: 0,
      DESPACHADO: 0,
      EN_TRANSITO: 0,
      ENTREGADO: 0,
      FALLIDO: 0,
      DEVUELTO: 0
    },
    vendedoresTotal: 0,
    vendedoresPorEstado: {
      EN_REVISION: 0,
      ACTIVO: 0,
      SUSPENDIDO: 0,
      INACTIVO: 0
    },
    operadoresLogisticosTotal: 0,
    operadoresLogisticosPorEstado: { ACTIVO: 0, INACTIVO: 0 },
    compradoresTotal: 0,
    compradoresPorEstado: { HABILITADO: 0, RESTRINGIDO: 0 }
  };
}

function readError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  return new DependencyUnavailableError(
    "No fue posible consultar la información de supervisión.",
    { cause: messageOf(error) }
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
