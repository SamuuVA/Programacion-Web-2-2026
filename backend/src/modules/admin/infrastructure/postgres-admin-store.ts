import { Pool } from "pg";
import {
  ApplicationError,
  DependencyUnavailableError
} from "../../../shared/domain/errors.js";
import type { CategoriaProducto } from "../../catalog/domain/producto.js";
import type { DireccionSnapshot } from "../../buyers/domain/direccion-entrega.js";
import type { EstadoEnvio } from "../../logistics/domain/envio.js";
import type {
  EstadoPago,
  EstadoPedido
} from "../../orders/application/ports.js";
import type {
  EstadoProductoVendedor,
  TipoEntregaVendedor
} from "../../seller-workspace/domain/producto-vendedor.js";
import type { EstadoVendedor } from "../../seller-workspace/application/ports.js";
import type {
  EstadoUsuario,
  RolSistema
} from "../../identity/domain/usuario.js";
import {
  type AdminBuyerDetail,
  type AdminBuyerFilter,
  type AdminBuyerOrderView,
  type AdminBuyerSummary,
  type AdminDashboardView,
  type AdminDeliveryView,
  type AdminEvidenceView,
  type AdminHistoryView,
  type AdminInventoryFilter,
  type AdminInventoryTotals,
  type AdminInventoryView,
  type AdminMovementFilter,
  type AdminMovementView,
  type AdminOrderDetail,
  type AdminOrderFilter,
  type AdminOrderItemView,
  type AdminOrderSummary,
  type AdminPage,
  type AdminPaymentFilter,
  type AdminPaymentSummary,
  type AdminPaymentView,
  type AdminProductDetail,
  type AdminProductFilter,
  type AdminProductImageView,
  type AdminProductInventoryView,
  type AdminProductSummary,
  type AdminReportsView,
  type AdminReservationView,
  type AdminSellerDetail,
  type AdminSellerFilter,
  type AdminSellerSummary,
  type AdminShipmentItemView,
  type AdminShipmentView,
  type AdminStore,
  type AdminUserDetail,
  type AdminUserFilter,
  type AdminUserProfile,
  type AdminUserSummary,
  type AdminWarehouseDetail,
  type AdminWarehouseFilter,
  type AdminWarehouseInventoryView,
  type AdminWarehouseOperatorView,
  type AdminWarehouseView
} from "../application/ports.js";

/**
 * Adaptador PostgreSQL de consulta del Administrador.
 *
 * Todas las sentencias son `SELECT`. Las altas de vendedor y de operador
 * logístico conservan sus propios adaptadores transaccionales. Este adaptador
 * aplica minimización: no lee `hash_credencial`, documentos de identidad,
 * tokens de sesión, la referencia del proveedor de pago ni la dirección
 * completa de entrega (solo ciudad, región y país).
 */

interface UserRow {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: RolSistema;
  estado: EstadoUsuario;
  creado_en: Date;
  actualizado_en: Date;
  perfil_id: string | null;
}

interface UserDetailRow extends UserRow {
  comprador_id: string | null;
  estado_comercial: "HABILITADO" | "RESTRINGIDO" | null;
  comprador_creado_en: Date | null;
  comprador_pedidos_count: number | null;
  vendedor_id: string | null;
  nombre_comercial: string | null;
  vendedor_estado: EstadoVendedor | null;
  vendedor_creado_en: Date | null;
  vendedor_bodegas_count: number | null;
  vendedor_productos_count: number | null;
  operador_id: string | null;
  nombre_operador: string | null;
  operador_estado: "ACTIVO" | "INACTIVO" | null;
  operador_creado_en: Date | null;
  operador_bodegas_count: number | null;
}

interface BuyerRow {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  correo_electronico: string;
  estado_comercial: "HABILITADO" | "RESTRINGIDO";
  usuario_estado: EstadoUsuario;
  creado_en: Date;
  pedidos_count: number;
}

interface BuyerOrderRow {
  id: string;
  numero: string;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  moneda: string;
  total_centavos: string | number;
  vendedor_nombre: string;
  creado_en: Date;
}

interface SellerRow {
  id: string;
  usuario_id: string;
  nombre_comercial: string;
  correo_electronico: string;
  usuario_estado: EstadoUsuario;
  estado: EstadoVendedor;
  creado_en: Date;
  productos_count: number;
  productos_publicados_count: number;
  bodegas_count: number;
  inventario_disponible: number;
}

interface WarehouseRow {
  id: string;
  nombre: string;
  ubicacion: string;
  tipo: "MARKETPLACE" | "VENDEDOR";
  estado: "ACTIVA" | "INACTIVA";
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  vendedor_correo: string | null;
  creada_en: Date;
  productos_count: number;
  inventario_disponible: number;
}

interface WarehouseInventoryRow {
  producto_id: string;
  producto_nombre: string;
  sku: string;
  on_hand: number;
  reserved: number;
  unavailable: number;
  actualizado_en: Date;
}

interface WarehouseOperatorRow {
  id: string;
  nombre_operador: string;
  estado: "ACTIVO" | "INACTIVO";
  asignada_en: Date;
}

interface MovementRow {
  id: string;
  producto_id: string;
  producto_nombre: string;
  sku: string;
  bodega_id: string;
  bodega_nombre: string;
  vendedor_id: string;
  vendedor_nombre: string;
  tipo: string;
  cantidad: number;
  referencia_tipo: string;
  referencia_id: string;
  motivo: string | null;
  ocurrido_en: Date;
}

interface ProductRow {
  id: string;
  vendedor_id: string;
  vendedor_nombre: string;
  nombre: string;
  sku: string;
  categoria: CategoriaProducto;
  estado: EstadoProductoVendedor;
  tipo_entrega: TipoEntregaVendedor;
  precio_centavos: string | number;
  moneda: string;
  imagen_principal: string | null;
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

interface InventoryRow {
  producto_id: string;
  producto_nombre: string;
  sku: string;
  vendedor_id: string | null;
  vendedor_nombre: string | null;
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
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  moneda: string;
  total_centavos: string | number;
  comprador_id: string;
  comprador_nombre: string;
  vendedor_id: string;
  vendedor_nombre: string;
  direccion_entrega: DireccionSnapshot | null;
  creado_en: Date;
  actualizado_en: Date;
  items_count: number;
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
  estado: "ACTIVA" | "LIBERADA" | "CONSUMIDA";
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

interface PaymentSummaryRow {
  id: string;
  pedido_id: string;
  pedido_numero: string;
  comprador_id: string;
  comprador_nombre: string;
  vendedor_nombre: string;
  estado: EstadoPago;
  proveedor: string;
  monto_centavos: string | number;
  moneda: string;
  creado_en: Date;
  actualizado_en: Date;
}

interface CountRow {
  total: number;
}

interface ReportsRow {
  usuarios_total: number;
  usuarios_comprador: number;
  usuarios_vendedor: number;
  usuarios_operador: number;
  usuarios_administrador: number;
  usuarios_supervisor: number;
  usuarios_activo: number;
  usuarios_inactivo: number;
  usuarios_bloqueado: number;
  compradores_total: number;
  compradores_habilitado: number;
  compradores_restringido: number;
  vendedores_total: number;
  vendedores_en_revision: number;
  vendedores_activo: number;
  vendedores_suspendido: number;
  vendedores_inactivo: number;
  operadores_total: number;
  operadores_activo: number;
  operadores_inactivo: number;
  bodegas_total: number;
  bodegas_activa: number;
  bodegas_inactiva: number;
  bodegas_marketplace: number;
  bodegas_vendedor: number;
  productos_total: number;
  productos_borrador: number;
  productos_publicado: number;
  productos_suspendido: number;
  productos_descontinuado: number;
  productos_electronica: number;
  productos_ropa: number;
  productos_hogar: number;
  productos_categoria_digital: number;
  productos_fisica: number;
  productos_digital: number;
  inventario_posiciones: number;
  inventario_on_hand: number;
  inventario_reserved: number;
  inventario_unavailable: number;
  inventario_disponible: number;
  pedidos_total: number;
  pedidos_pendiente_de_pago: number;
  pedidos_pagado: number;
  pedidos_en_preparacion: number;
  pedidos_despachado: number;
  pedidos_entregado: number;
  pedidos_cancelado: number;
  pedidos_cerrado: number;
  pagos_total: number;
  pagos_pendiente: number;
  pagos_autorizado: number;
  pagos_capturado: number;
  pagos_rechazado: number;
  pagos_cancelado: number;
  pagos_reembolso_parcial: number;
  pagos_reembolsado: number;
  envios_total: number;
  envios_preparacion: number;
  envios_empacado: number;
  envios_despachado: number;
  envios_en_transito: number;
  envios_entregado: number;
  envios_fallido: number;
  envios_devuelto: number;
}

const USER_SELECT = `
  SELECT u.id, u.nombre_completo, u.correo_normalizado AS correo_electronico,
         u.rol, u.estado, u.creado_en, u.actualizado_en,
         COALESCE(b.id::text, s.id::text, lo.id::text) AS perfil_id
    FROM users u
    LEFT JOIN buyers b ON b.usuario_id = u.id
    LEFT JOIN sellers s ON s.usuario_id = u.id
    LEFT JOIN logistics_operators lo ON lo.usuario_id = u.id
`;

const USER_DETAIL_SELECT = `
  SELECT u.id, u.nombre_completo, u.correo_normalizado AS correo_electronico,
         u.rol, u.estado, u.creado_en, u.actualizado_en,
         COALESCE(b.id::text, s.id::text, lo.id::text) AS perfil_id,
         b.id AS comprador_id, b.estado_comercial,
         b.creado_en AS comprador_creado_en,
         (SELECT COUNT(*)::int FROM orders o WHERE o.comprador_id = b.id)
           AS comprador_pedidos_count,
         s.id AS vendedor_id, s.nombre_comercial,
         s.estado AS vendedor_estado, s.creado_en AS vendedor_creado_en,
         (SELECT COUNT(*)::int FROM warehouses w WHERE w.vendedor_id = s.id)
           AS vendedor_bodegas_count,
         (SELECT COUNT(*)::int FROM products p WHERE p.vendedor_id = s.id)
           AS vendedor_productos_count,
         lo.id AS operador_id, lo.nombre_operador,
         lo.estado AS operador_estado, lo.creado_en AS operador_creado_en,
         (SELECT COUNT(*)::int
            FROM logistics_operator_warehouses low
           WHERE low.operador_id = lo.id) AS operador_bodegas_count
    FROM users u
    LEFT JOIN buyers b ON b.usuario_id = u.id
    LEFT JOIN sellers s ON s.usuario_id = u.id
    LEFT JOIN logistics_operators lo ON lo.usuario_id = u.id
`;

const BUYER_SELECT = `
  SELECT b.id, b.usuario_id, u.nombre_completo,
         u.correo_normalizado AS correo_electronico,
         b.estado_comercial, u.estado AS usuario_estado, b.creado_en,
         (SELECT COUNT(*)::int FROM orders o WHERE o.comprador_id = b.id)
           AS pedidos_count
    FROM buyers b
    JOIN users u ON u.id = b.usuario_id
`;

const SELLER_SELECT = `
  SELECT s.id, s.usuario_id, s.nombre_comercial,
         u.correo_normalizado AS correo_electronico,
         u.estado AS usuario_estado, s.estado, s.creado_en,
         (SELECT COUNT(*)::int FROM products p WHERE p.vendedor_id = s.id)
           AS productos_count,
         (SELECT COUNT(*)::int
            FROM products p
           WHERE p.vendedor_id = s.id AND p.estado = 'PUBLICADO')
           AS productos_publicados_count,
         (SELECT COUNT(*)::int FROM warehouses w WHERE w.vendedor_id = s.id)
           AS bodegas_count,
         COALESCE((
           SELECT SUM(i.on_hand - i.reserved - i.unavailable)::int
             FROM inventory i
             JOIN warehouses w ON w.id = i.bodega_id
            WHERE w.vendedor_id = s.id
         ), 0) AS inventario_disponible
    FROM sellers s
    JOIN users u ON u.id = s.usuario_id
`;

const WAREHOUSE_SELECT = `
  SELECT w.id, w.nombre, w.ubicacion, w.tipo, w.estado, w.vendedor_id,
         s.nombre_comercial AS vendedor_nombre,
         u.correo_normalizado AS vendedor_correo,
         w.creada_en,
         (SELECT COUNT(DISTINCT i.producto_id)::int
            FROM inventory i
           WHERE i.bodega_id = w.id) AS productos_count,
         COALESCE((
           SELECT SUM(i.on_hand - i.reserved - i.unavailable)::int
             FROM inventory i
            WHERE i.bodega_id = w.id
         ), 0) AS inventario_disponible
    FROM warehouses w
    LEFT JOIN sellers s ON s.id = w.vendedor_id
    LEFT JOIN users u ON u.id = s.usuario_id
`;

const PRODUCT_SELECT = `
  SELECT p.id, p.vendedor_id, s.nombre_comercial AS vendedor_nombre,
         p.nombre, p.sku, p.categoria, p.estado, p.tipo_entrega,
         p.precio_centavos, p.moneda, p.creado_en, p.actualizado_en,
         (SELECT pi.url
            FROM product_images pi
           WHERE pi.producto_id = p.id
           ORDER BY pi.orden ASC, pi.id ASC
           LIMIT 1) AS imagen_principal,
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

const PRODUCT_DETAIL_SELECT = `
  SELECT p.id, p.vendedor_id, s.nombre_comercial AS vendedor_nombre,
         p.nombre, p.descripcion, p.sku, p.categoria, p.estado, p.tipo_entrega,
         p.precio_centavos, p.moneda, p.creado_en, p.actualizado_en,
         (SELECT pi.url
            FROM product_images pi
           WHERE pi.producto_id = p.id
           ORDER BY pi.orden ASC, pi.id ASC
           LIMIT 1) AS imagen_principal,
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

const INVENTORY_SELECT = `
  SELECT i.producto_id, p.nombre AS producto_nombre, p.sku,
         w.vendedor_id, s.nombre_comercial AS vendedor_nombre,
         i.bodega_id, w.nombre AS bodega_nombre,
         i.on_hand, i.reserved, i.unavailable, i.actualizado_en
    FROM inventory i
    JOIN products p ON p.id = i.producto_id
    JOIN warehouses w ON w.id = i.bodega_id
    LEFT JOIN sellers s ON s.id = w.vendedor_id
`;

const MOVEMENT_SELECT = `
  SELECT m.id, m.producto_id, p.nombre AS producto_nombre, p.sku,
         m.bodega_id, w.nombre AS bodega_nombre,
         m.vendedor_id, s.nombre_comercial AS vendedor_nombre,
         m.tipo, m.cantidad, m.referencia_tipo, m.referencia_id, m.motivo,
         m.ocurrido_en
    FROM inventory_movements m
    JOIN products p ON p.id = m.producto_id
    JOIN warehouses w ON w.id = m.bodega_id
    JOIN sellers s ON s.id = m.vendedor_id
`;

const ORDER_SELECT = `
  SELECT o.id, o.numero, o.estado, o.estado_pago, o.moneda,
         o.total_centavos, o.comprador_id,
         u.nombre_completo AS comprador_nombre,
         o.vendedor_id, s.nombre_comercial AS vendedor_nombre,
         o.direccion_entrega, o.creado_en, o.actualizado_en,
         COUNT(oi.id)::int AS items_count
    FROM orders o
    JOIN buyers b ON b.id = o.comprador_id
    JOIN users u ON u.id = b.usuario_id
    JOIN sellers s ON s.id = o.vendedor_id
    LEFT JOIN order_items oi ON oi.pedido_id = o.id
`;

const PAYMENT_SELECT = `
  SELECT pay.id, pay.pedido_id, o.numero AS pedido_numero,
         o.comprador_id, u.nombre_completo AS comprador_nombre,
         s.nombre_comercial AS vendedor_nombre,
         pay.estado, pay.proveedor, pay.monto_centavos, pay.moneda,
         pay.creado_en, pay.actualizado_en
    FROM payments pay
    JOIN orders o ON o.id = pay.pedido_id
    JOIN buyers b ON b.id = o.comprador_id
    JOIN users u ON u.id = b.usuario_id
    JOIN sellers s ON s.id = o.vendedor_id
`;

export class PostgresAdminStore implements AdminStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async dashboard(): Promise<AdminDashboardView> {
    try {
      const reports = await this.reports();
      const [users, buyers, sellers, orders] = await Promise.all([
        this.pool.query<UserRow>(
          `${USER_SELECT} ORDER BY u.creado_en DESC, u.id DESC LIMIT 5`
        ),
        this.pool.query<BuyerRow>(
          `${BUYER_SELECT} ORDER BY b.creado_en DESC, b.id DESC LIMIT 5`
        ),
        this.pool.query<SellerRow>(
          `${SELLER_SELECT} ORDER BY s.creado_en DESC, s.id DESC LIMIT 5`
        ),
        this.pool.query<OrderRow>(
          `${ORDER_SELECT}
            GROUP BY o.id, u.nombre_completo, s.nombre_comercial
            ORDER BY o.creado_en DESC, o.id DESC
            LIMIT 5`
        )
      ]);
      return {
        ...reports,
        recientes: {
          usuarios: users.rows.map(toUser),
          compradores: buyers.rows.map(toBuyer),
          vendedores: sellers.rows.map(toSeller),
          pedidos: orders.rows.map(toOrderSummary)
        }
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async reports(): Promise<AdminReportsView> {
    try {
      const result = await this.pool.query<ReportsRow>(REPORTS_SELECT);
      const row = result.rows[0];
      if (!row) {
        return emptyReports();
      }
      return {
        usuarios: {
          total: row.usuarios_total,
          porRol: {
            COMPRADOR: row.usuarios_comprador,
            VENDEDOR: row.usuarios_vendedor,
            OPERADOR_LOGISTICO: row.usuarios_operador,
            ADMINISTRADOR: row.usuarios_administrador,
            SUPERVISOR: row.usuarios_supervisor
          },
          porEstado: {
            ACTIVO: row.usuarios_activo,
            INACTIVO: row.usuarios_inactivo,
            BLOQUEADO: row.usuarios_bloqueado
          }
        },
        compradores: {
          total: row.compradores_total,
          porEstado: {
            HABILITADO: row.compradores_habilitado,
            RESTRINGIDO: row.compradores_restringido
          }
        },
        vendedores: {
          total: row.vendedores_total,
          porEstado: {
            EN_REVISION: row.vendedores_en_revision,
            ACTIVO: row.vendedores_activo,
            SUSPENDIDO: row.vendedores_suspendido,
            INACTIVO: row.vendedores_inactivo
          }
        },
        operadoresLogisticos: {
          total: row.operadores_total,
          porEstado: {
            ACTIVO: row.operadores_activo,
            INACTIVO: row.operadores_inactivo
          }
        },
        bodegas: {
          total: row.bodegas_total,
          porEstado: {
            ACTIVA: row.bodegas_activa,
            INACTIVA: row.bodegas_inactiva
          },
          porTipo: {
            MARKETPLACE: row.bodegas_marketplace,
            VENDEDOR: row.bodegas_vendedor
          }
        },
        catalogo: {
          total: row.productos_total,
          porEstado: {
            BORRADOR: row.productos_borrador,
            PUBLICADO: row.productos_publicado,
            SUSPENDIDO: row.productos_suspendido,
            DESCONTINUADO: row.productos_descontinuado
          },
          porCategoria: {
            ELECTRONICA: row.productos_electronica,
            ROPA: row.productos_ropa,
            HOGAR: row.productos_hogar,
            DIGITAL: row.productos_categoria_digital
          },
          porTipoEntrega: {
            FISICA: row.productos_fisica,
            DIGITAL: row.productos_digital
          }
        },
        inventario: {
          posiciones: row.inventario_posiciones,
          onHand: row.inventario_on_hand,
          reserved: row.inventario_reserved,
          unavailable: row.inventario_unavailable,
          disponible: row.inventario_disponible
        },
        pedidos: {
          total: row.pedidos_total,
          porEstado: {
            PENDIENTE_DE_PAGO: row.pedidos_pendiente_de_pago,
            PAGADO: row.pedidos_pagado,
            EN_PREPARACION: row.pedidos_en_preparacion,
            DESPACHADO: row.pedidos_despachado,
            ENTREGADO: row.pedidos_entregado,
            CANCELADO: row.pedidos_cancelado,
            CERRADO: row.pedidos_cerrado
          }
        },
        pagos: {
          total: row.pagos_total,
          porEstado: {
            PENDIENTE: row.pagos_pendiente,
            AUTORIZADO: row.pagos_autorizado,
            CAPTURADO: row.pagos_capturado,
            RECHAZADO: row.pagos_rechazado,
            CANCELADO: row.pagos_cancelado,
            REEMBOLSO_PARCIAL: row.pagos_reembolso_parcial,
            REEMBOLSADO: row.pagos_reembolsado
          }
        },
        envios: {
          total: row.envios_total,
          porEstado: {
            PREPARACION: row.envios_preparacion,
            EMPACADO: row.envios_empacado,
            DESPACHADO: row.envios_despachado,
            EN_TRANSITO: row.envios_en_transito,
            ENTREGADO: row.envios_entregado,
            FALLIDO: row.envios_fallido,
            DEVUELTO: row.envios_devuelto
          }
        }
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listUsers(
    filter: AdminUserFilter
  ): Promise<AdminPage<AdminUserSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM users u
          WHERE ($1::text IS NULL OR u.rol = $1)
            AND ($2::text IS NULL OR u.estado = $2)
            AND ($3::text IS NULL
                 OR u.nombre_completo ILIKE '%' || $3 || '%'
                 OR u.correo_normalizado ILIKE '%' || $3 || '%')`,
        [filter.rol, filter.estado, filter.search]
      );
      const result = await this.pool.query<UserRow>(
        `${USER_SELECT}
          WHERE ($1::text IS NULL OR u.rol = $1)
            AND ($2::text IS NULL OR u.estado = $2)
            AND ($3::text IS NULL
                 OR u.nombre_completo ILIKE '%' || $3 || '%'
                 OR u.correo_normalizado ILIKE '%' || $3 || '%')
          ORDER BY u.creado_en DESC, u.id DESC
          LIMIT $4 OFFSET $5`,
        [
          filter.rol,
          filter.estado,
          filter.search,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(result.rows.map(toUser), count.rows[0]?.total ?? 0, filter);
    } catch (error) {
      throw readError(error);
    }
  }

  async findUser(userId: string): Promise<AdminUserDetail | null> {
    try {
      const result = await this.pool.query<UserDetailRow>(
        `${USER_DETAIL_SELECT} WHERE u.id = $1`,
        [userId]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return { ...toUser(row), perfil: toUserProfile(row) };
    } catch (error) {
      throw readError(error);
    }
  }

  async listBuyers(
    filter: AdminBuyerFilter
  ): Promise<AdminPage<AdminBuyerSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM buyers b
           JOIN users u ON u.id = b.usuario_id
          WHERE ($1::text IS NULL OR b.estado_comercial = $1)
            AND ($2::text IS NULL
                 OR u.nombre_completo ILIKE '%' || $2 || '%'
                 OR u.correo_normalizado ILIKE '%' || $2 || '%')`,
        [filter.estadoComercial, filter.search]
      );
      const result = await this.pool.query<BuyerRow>(
        `${BUYER_SELECT}
          WHERE ($1::text IS NULL OR b.estado_comercial = $1)
            AND ($2::text IS NULL
                 OR u.nombre_completo ILIKE '%' || $2 || '%'
                 OR u.correo_normalizado ILIKE '%' || $2 || '%')
          ORDER BY b.creado_en DESC, b.id DESC
          LIMIT $3 OFFSET $4`,
        [
          filter.estadoComercial,
          filter.search,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toBuyer),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async findBuyer(buyerId: string): Promise<AdminBuyerDetail | null> {
    try {
      const result = await this.pool.query<BuyerRow>(
        `${BUYER_SELECT} WHERE b.id = $1`,
        [buyerId]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const orders = await this.pool.query<BuyerOrderRow>(
        `SELECT o.id, o.numero, o.estado, o.estado_pago, o.moneda,
                o.total_centavos, s.nombre_comercial AS vendedor_nombre,
                o.creado_en
           FROM orders o
           JOIN sellers s ON s.id = o.vendedor_id
          WHERE o.comprador_id = $1
          ORDER BY o.creado_en DESC, o.id DESC
          LIMIT 20`,
        [buyerId]
      );
      return {
        ...toBuyer(row),
        pedidos: orders.rows.map(toBuyerOrder)
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listSellers(
    filter: AdminSellerFilter
  ): Promise<AdminPage<AdminSellerSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM sellers s
           JOIN users u ON u.id = s.usuario_id
          WHERE ($1::text IS NULL OR s.estado = $1)
            AND ($2::text IS NULL
                 OR s.nombre_comercial ILIKE '%' || $2 || '%'
                 OR u.nombre_completo ILIKE '%' || $2 || '%'
                 OR u.correo_normalizado ILIKE '%' || $2 || '%')`,
        [filter.estado, filter.search]
      );
      const result = await this.pool.query<SellerRow>(
        `${SELLER_SELECT}
          WHERE ($1::text IS NULL OR s.estado = $1)
            AND ($2::text IS NULL
                 OR s.nombre_comercial ILIKE '%' || $2 || '%'
                 OR u.nombre_completo ILIKE '%' || $2 || '%'
                 OR u.correo_normalizado ILIKE '%' || $2 || '%')
          ORDER BY s.creado_en DESC, s.id DESC
          LIMIT $3 OFFSET $4`,
        [
          filter.estado,
          filter.search,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toSeller),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async findSeller(sellerId: string): Promise<AdminSellerDetail | null> {
    try {
      const result = await this.pool.query<SellerRow>(
        `${SELLER_SELECT} WHERE s.id = $1`,
        [sellerId]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const [warehouses, products, inventory, orders] = await Promise.all([
        this.pool.query<WarehouseRow>(
          `${WAREHOUSE_SELECT}
            WHERE w.vendedor_id = $1
            ORDER BY w.nombre ASC, w.id ASC`,
          [sellerId]
        ),
        this.pool.query<ProductRow>(
          `${PRODUCT_SELECT}
            WHERE p.vendedor_id = $1
            ORDER BY p.creado_en DESC, p.id DESC
            LIMIT 20`,
          [sellerId]
        ),
        this.pool.query<InventoryTotalsRow>(
          `SELECT COUNT(*)::int AS posiciones,
                  COALESCE(SUM(i.on_hand), 0)::int AS on_hand,
                  COALESCE(SUM(i.reserved), 0)::int AS reserved,
                  COALESCE(SUM(i.unavailable), 0)::int AS unavailable,
                  COALESCE(SUM(i.on_hand - i.reserved - i.unavailable), 0)::int
                    AS disponible
             FROM inventory i
             JOIN warehouses w ON w.id = i.bodega_id
            WHERE w.vendedor_id = $1`,
          [sellerId]
        ),
        this.pool.query<CountRow>(
          `SELECT COUNT(*)::int AS total FROM orders WHERE vendedor_id = $1`,
          [sellerId]
        )
      ]);
      return {
        ...toSeller(row),
        bodegas: warehouses.rows.map(toWarehouse),
        productos: products.rows.map(toProductSummary),
        inventario: toInventoryTotals(inventory.rows[0]),
        pedidosCount: orders.rows[0]?.total ?? 0
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listWarehouses(
    filter: AdminWarehouseFilter
  ): Promise<AdminPage<AdminWarehouseView>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM warehouses w
           LEFT JOIN sellers s ON s.id = w.vendedor_id
          WHERE ($1::text IS NULL OR w.estado = $1)
            AND ($2::uuid IS NULL OR w.vendedor_id = $2)
            AND ($3::text IS NULL
                 OR w.nombre ILIKE '%' || $3 || '%'
                 OR w.ubicacion ILIKE '%' || $3 || '%'
                 OR s.nombre_comercial ILIKE '%' || $3 || '%')`,
        [filter.estado, filter.vendedorId, filter.search]
      );
      const result = await this.pool.query<WarehouseRow>(
        `${WAREHOUSE_SELECT}
          WHERE ($1::text IS NULL OR w.estado = $1)
            AND ($2::uuid IS NULL OR w.vendedor_id = $2)
            AND ($3::text IS NULL
                 OR w.nombre ILIKE '%' || $3 || '%'
                 OR w.ubicacion ILIKE '%' || $3 || '%'
                 OR s.nombre_comercial ILIKE '%' || $3 || '%')
          ORDER BY w.nombre ASC, w.id ASC
          LIMIT $4 OFFSET $5`,
        [
          filter.estado,
          filter.vendedorId,
          filter.search,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toWarehouse),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async findWarehouse(
    warehouseId: string
  ): Promise<AdminWarehouseDetail | null> {
    try {
      const result = await this.pool.query<WarehouseRow>(
        `${WAREHOUSE_SELECT} WHERE w.id = $1`,
        [warehouseId]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const [inventory, movements, operators] = await Promise.all([
        this.pool.query<WarehouseInventoryRow>(
          `SELECT i.producto_id, p.nombre AS producto_nombre, p.sku,
                  i.on_hand, i.reserved, i.unavailable, i.actualizado_en
             FROM inventory i
             JOIN products p ON p.id = i.producto_id
            WHERE i.bodega_id = $1
            ORDER BY p.nombre ASC, p.id ASC`,
          [warehouseId]
        ),
        this.pool.query<MovementRow>(
          `${MOVEMENT_SELECT}
            WHERE m.bodega_id = $1
            ORDER BY m.ocurrido_en DESC, m.id DESC
            LIMIT 20`,
          [warehouseId]
        ),
        this.pool.query<WarehouseOperatorRow>(
          `SELECT lo.id, lo.nombre_operador, lo.estado, low.asignada_en
             FROM logistics_operator_warehouses low
             JOIN logistics_operators lo ON lo.id = low.operador_id
            WHERE low.bodega_id = $1
            ORDER BY lo.nombre_operador ASC, lo.id ASC`,
          [warehouseId]
        )
      ]);
      return {
        ...toWarehouse(row),
        inventario: inventory.rows.map(toWarehouseInventory),
        movimientos: movements.rows.map(toMovement),
        operadores: operators.rows.map(toWarehouseOperator)
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listProducts(
    filter: AdminProductFilter
  ): Promise<AdminPage<AdminProductSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM products p
           JOIN sellers s ON s.id = p.vendedor_id
          WHERE ($1::text IS NULL OR p.estado = $1)
            AND ($2::text IS NULL OR p.categoria = $2)
            AND ($3::text IS NULL OR p.tipo_entrega = $3)
            AND ($4::uuid IS NULL OR p.vendedor_id = $4)
            AND ($5::text IS NULL
                 OR p.nombre ILIKE '%' || $5 || '%'
                 OR p.sku ILIKE '%' || $5 || '%'
                 OR s.nombre_comercial ILIKE '%' || $5 || '%')`,
        [
          filter.estado,
          filter.categoria,
          filter.tipoEntrega,
          filter.vendedorId,
          filter.search
        ]
      );
      const result = await this.pool.query<ProductRow>(
        `${PRODUCT_SELECT}
          WHERE ($1::text IS NULL OR p.estado = $1)
            AND ($2::text IS NULL OR p.categoria = $2)
            AND ($3::text IS NULL OR p.tipo_entrega = $3)
            AND ($4::uuid IS NULL OR p.vendedor_id = $4)
            AND ($5::text IS NULL
                 OR p.nombre ILIKE '%' || $5 || '%'
                 OR p.sku ILIKE '%' || $5 || '%'
                 OR s.nombre_comercial ILIKE '%' || $5 || '%')
          ORDER BY p.creado_en DESC, p.id DESC
          LIMIT $6 OFFSET $7`,
        [
          filter.estado,
          filter.categoria,
          filter.tipoEntrega,
          filter.vendedorId,
          filter.search,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toProductSummary),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async findProduct(productId: string): Promise<AdminProductDetail | null> {
    try {
      const result = await this.pool.query<ProductDetailRow>(
        `${PRODUCT_DETAIL_SELECT} WHERE p.id = $1`,
        [productId]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const [images, inventory] = await Promise.all([
        this.pool.query<ProductImageRow>(
          `SELECT id, url, alt, orden
             FROM product_images
            WHERE producto_id = $1
            ORDER BY orden ASC, id ASC`,
          [productId]
        ),
        this.pool.query<ProductInventoryRow>(
          `SELECT i.bodega_id, w.nombre AS bodega_nombre, i.on_hand, i.reserved,
                  i.unavailable, i.actualizado_en
             FROM inventory i
             JOIN warehouses w ON w.id = i.bodega_id
            WHERE i.producto_id = $1
            ORDER BY w.nombre ASC, w.id ASC`,
          [productId]
        )
      ]);
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

  async listInventory(
    filter: AdminInventoryFilter
  ): Promise<AdminPage<AdminInventoryView>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM inventory i
           JOIN products p ON p.id = i.producto_id
           JOIN warehouses w ON w.id = i.bodega_id
           LEFT JOIN sellers s ON s.id = w.vendedor_id
          WHERE ($1::uuid IS NULL OR i.bodega_id = $1)
            AND ($2::uuid IS NULL OR i.producto_id = $2)
            AND ($3::uuid IS NULL OR w.vendedor_id = $3)
            AND ($4::text IS NULL
                 OR p.nombre ILIKE '%' || $4 || '%'
                 OR p.sku ILIKE '%' || $4 || '%'
                 OR w.nombre ILIKE '%' || $4 || '%'
                 OR s.nombre_comercial ILIKE '%' || $4 || '%')`,
        [filter.bodegaId, filter.productoId, filter.vendedorId, filter.search]
      );
      const result = await this.pool.query<InventoryRow>(
        `${INVENTORY_SELECT}
          WHERE ($1::uuid IS NULL OR i.bodega_id = $1)
            AND ($2::uuid IS NULL OR i.producto_id = $2)
            AND ($3::uuid IS NULL OR w.vendedor_id = $3)
            AND ($4::text IS NULL
                 OR p.nombre ILIKE '%' || $4 || '%'
                 OR p.sku ILIKE '%' || $4 || '%'
                 OR w.nombre ILIKE '%' || $4 || '%'
                 OR s.nombre_comercial ILIKE '%' || $4 || '%')
          ORDER BY w.nombre ASC, p.nombre ASC, i.producto_id ASC
          LIMIT $5 OFFSET $6`,
        [
          filter.bodegaId,
          filter.productoId,
          filter.vendedorId,
          filter.search,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toInventory),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async listMovements(
    filter: AdminMovementFilter
  ): Promise<AdminPage<AdminMovementView>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM inventory_movements m
          WHERE ($1::uuid IS NULL OR m.bodega_id = $1)
            AND ($2::uuid IS NULL OR m.producto_id = $2)`,
        [filter.bodegaId, filter.productoId]
      );
      const result = await this.pool.query<MovementRow>(
        `${MOVEMENT_SELECT}
          WHERE ($1::uuid IS NULL OR m.bodega_id = $1)
            AND ($2::uuid IS NULL OR m.producto_id = $2)
          ORDER BY m.ocurrido_en DESC, m.id DESC
          LIMIT $3 OFFSET $4`,
        [
          filter.bodegaId,
          filter.productoId,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toMovement),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async listOrders(
    filter: AdminOrderFilter
  ): Promise<AdminPage<AdminOrderSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM orders o
           JOIN buyers b ON b.id = o.comprador_id
           JOIN users u ON u.id = b.usuario_id
           JOIN sellers s ON s.id = o.vendedor_id
          WHERE ($1::text IS NULL OR o.estado = $1)
            AND ($2::text IS NULL
                 OR o.numero ILIKE '%' || $2 || '%'
                 OR u.nombre_completo ILIKE '%' || $2 || '%'
                 OR s.nombre_comercial ILIKE '%' || $2 || '%')`,
        [filter.estado, filter.search]
      );
      const result = await this.pool.query<OrderRow>(
        `${ORDER_SELECT}
          WHERE ($1::text IS NULL OR o.estado = $1)
            AND ($2::text IS NULL
                 OR o.numero ILIKE '%' || $2 || '%'
                 OR u.nombre_completo ILIKE '%' || $2 || '%'
                 OR s.nombre_comercial ILIKE '%' || $2 || '%')
          GROUP BY o.id, u.nombre_completo, s.nombre_comercial
          ORDER BY o.creado_en DESC, o.id DESC
          LIMIT $3 OFFSET $4`,
        [
          filter.estado,
          filter.search,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toOrderSummary),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async findOrder(orderId: string): Promise<AdminOrderDetail | null> {
    try {
      const order = await this.pool.query<OrderRow>(
        `${ORDER_SELECT}
          WHERE o.id = $1
          GROUP BY o.id, u.nombre_completo, s.nombre_comercial
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
        historial: history.rows.map(toHistory),
        entrega: toDelivery(row.direccion_entrega)
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listPayments(
    filter: AdminPaymentFilter
  ): Promise<AdminPage<AdminPaymentSummary>> {
    try {
      const count = await this.pool.query<CountRow>(
        `SELECT COUNT(*)::int AS total
           FROM payments pay
           JOIN orders o ON o.id = pay.pedido_id
           JOIN buyers b ON b.id = o.comprador_id
           JOIN users u ON u.id = b.usuario_id
          WHERE ($1::text IS NULL OR pay.estado = $1)
            AND ($2::text IS NULL
                 OR o.numero ILIKE '%' || $2 || '%'
                 OR u.nombre_completo ILIKE '%' || $2 || '%')`,
        [filter.estado, filter.search]
      );
      const result = await this.pool.query<PaymentSummaryRow>(
        `${PAYMENT_SELECT}
          WHERE ($1::text IS NULL OR pay.estado = $1)
            AND ($2::text IS NULL
                 OR o.numero ILIKE '%' || $2 || '%'
                 OR u.nombre_completo ILIKE '%' || $2 || '%')
          ORDER BY pay.creado_en DESC, pay.id DESC
          LIMIT $3 OFFSET $4`,
        [
          filter.estado,
          filter.search,
          filter.pageSize,
          offsetOf(filter.page, filter.pageSize)
        ]
      );
      return pageOf(
        result.rows.map(toPaymentSummary),
        count.rows[0]?.total ?? 0,
        filter
      );
    } catch (error) {
      throw readError(error);
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible comprobar la base de datos administrativa.",
        { cause: messageOf(error) }
      );
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

interface InventoryTotalsRow {
  posiciones: number;
  on_hand: number;
  reserved: number;
  unavailable: number;
  disponible: number;
}

const REPORTS_SELECT = `
  SELECT
    (SELECT COUNT(*)::int FROM users) AS usuarios_total,
    (SELECT COUNT(*)::int FROM users WHERE rol = 'COMPRADOR') AS usuarios_comprador,
    (SELECT COUNT(*)::int FROM users WHERE rol = 'VENDEDOR') AS usuarios_vendedor,
    (SELECT COUNT(*)::int FROM users WHERE rol = 'OPERADOR_LOGISTICO') AS usuarios_operador,
    (SELECT COUNT(*)::int FROM users WHERE rol = 'ADMINISTRADOR') AS usuarios_administrador,
    (SELECT COUNT(*)::int FROM users WHERE rol = 'SUPERVISOR') AS usuarios_supervisor,
    (SELECT COUNT(*)::int FROM users WHERE estado = 'ACTIVO') AS usuarios_activo,
    (SELECT COUNT(*)::int FROM users WHERE estado = 'INACTIVO') AS usuarios_inactivo,
    (SELECT COUNT(*)::int FROM users WHERE estado = 'BLOQUEADO') AS usuarios_bloqueado,
    (SELECT COUNT(*)::int FROM buyers) AS compradores_total,
    (SELECT COUNT(*)::int FROM buyers WHERE estado_comercial = 'HABILITADO') AS compradores_habilitado,
    (SELECT COUNT(*)::int FROM buyers WHERE estado_comercial = 'RESTRINGIDO') AS compradores_restringido,
    (SELECT COUNT(*)::int FROM sellers) AS vendedores_total,
    (SELECT COUNT(*)::int FROM sellers WHERE estado = 'EN_REVISION') AS vendedores_en_revision,
    (SELECT COUNT(*)::int FROM sellers WHERE estado = 'ACTIVO') AS vendedores_activo,
    (SELECT COUNT(*)::int FROM sellers WHERE estado = 'SUSPENDIDO') AS vendedores_suspendido,
    (SELECT COUNT(*)::int FROM sellers WHERE estado = 'INACTIVO') AS vendedores_inactivo,
    (SELECT COUNT(*)::int FROM logistics_operators) AS operadores_total,
    (SELECT COUNT(*)::int FROM logistics_operators WHERE estado = 'ACTIVO') AS operadores_activo,
    (SELECT COUNT(*)::int FROM logistics_operators WHERE estado = 'INACTIVO') AS operadores_inactivo,
    (SELECT COUNT(*)::int FROM warehouses) AS bodegas_total,
    (SELECT COUNT(*)::int FROM warehouses WHERE estado = 'ACTIVA') AS bodegas_activa,
    (SELECT COUNT(*)::int FROM warehouses WHERE estado = 'INACTIVA') AS bodegas_inactiva,
    (SELECT COUNT(*)::int FROM warehouses WHERE tipo = 'MARKETPLACE') AS bodegas_marketplace,
    (SELECT COUNT(*)::int FROM warehouses WHERE tipo = 'VENDEDOR') AS bodegas_vendedor,
    (SELECT COUNT(*)::int FROM products) AS productos_total,
    (SELECT COUNT(*)::int FROM products WHERE estado = 'BORRADOR') AS productos_borrador,
    (SELECT COUNT(*)::int FROM products WHERE estado = 'PUBLICADO') AS productos_publicado,
    (SELECT COUNT(*)::int FROM products WHERE estado = 'SUSPENDIDO') AS productos_suspendido,
    (SELECT COUNT(*)::int FROM products WHERE estado = 'DESCONTINUADO') AS productos_descontinuado,
    (SELECT COUNT(*)::int FROM products WHERE categoria = 'ELECTRONICA') AS productos_electronica,
    (SELECT COUNT(*)::int FROM products WHERE categoria = 'ROPA') AS productos_ropa,
    (SELECT COUNT(*)::int FROM products WHERE categoria = 'HOGAR') AS productos_hogar,
    (SELECT COUNT(*)::int FROM products WHERE categoria = 'DIGITAL') AS productos_categoria_digital,
    (SELECT COUNT(*)::int FROM products WHERE tipo_entrega = 'FISICA') AS productos_fisica,
    (SELECT COUNT(*)::int FROM products WHERE tipo_entrega = 'DIGITAL') AS productos_digital,
    (SELECT COUNT(*)::int FROM inventory) AS inventario_posiciones,
    (SELECT COALESCE(SUM(on_hand), 0)::int FROM inventory) AS inventario_on_hand,
    (SELECT COALESCE(SUM(reserved), 0)::int FROM inventory) AS inventario_reserved,
    (SELECT COALESCE(SUM(unavailable), 0)::int FROM inventory) AS inventario_unavailable,
    (SELECT COALESCE(SUM(on_hand - reserved - unavailable), 0)::int FROM inventory) AS inventario_disponible,
    (SELECT COUNT(*)::int FROM orders) AS pedidos_total,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'PENDIENTE_DE_PAGO') AS pedidos_pendiente_de_pago,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'PAGADO') AS pedidos_pagado,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'EN_PREPARACION') AS pedidos_en_preparacion,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'DESPACHADO') AS pedidos_despachado,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'ENTREGADO') AS pedidos_entregado,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'CANCELADO') AS pedidos_cancelado,
    (SELECT COUNT(*)::int FROM orders WHERE estado = 'CERRADO') AS pedidos_cerrado,
    (SELECT COUNT(*)::int FROM payments) AS pagos_total,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'PENDIENTE') AS pagos_pendiente,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'AUTORIZADO') AS pagos_autorizado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'CAPTURADO') AS pagos_capturado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'RECHAZADO') AS pagos_rechazado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'CANCELADO') AS pagos_cancelado,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'REEMBOLSO_PARCIAL') AS pagos_reembolso_parcial,
    (SELECT COUNT(*)::int FROM payments WHERE estado = 'REEMBOLSADO') AS pagos_reembolsado,
    (SELECT COUNT(*)::int FROM shipments) AS envios_total,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'PREPARACION') AS envios_preparacion,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'EMPACADO') AS envios_empacado,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'DESPACHADO') AS envios_despachado,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'EN_TRANSITO') AS envios_en_transito,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'ENTREGADO') AS envios_entregado,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'FALLIDO') AS envios_fallido,
    (SELECT COUNT(*)::int FROM shipments WHERE estado = 'DEVUELTO') AS envios_devuelto
`;

function offsetOf(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

function pageOf<T>(
  items: readonly T[],
  total: number,
  filter: { readonly page: number; readonly pageSize: number }
): AdminPage<T> {
  return { items, total, page: filter.page, pageSize: filter.pageSize };
}

function toInteger(value: string | number): number {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function toUser(row: UserRow): AdminUserSummary {
  return {
    id: row.id,
    nombreCompleto: row.nombre_completo,
    correoElectronico: row.correo_electronico,
    rol: row.rol,
    estado: row.estado,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString(),
    perfilId: row.perfil_id
  };
}

function toUserProfile(row: UserDetailRow): AdminUserProfile | null {
  if (row.rol === "COMPRADOR" && row.comprador_id && row.estado_comercial) {
    return {
      tipo: "COMPRADOR",
      id: row.comprador_id,
      estadoComercial: row.estado_comercial,
      creadoEn: (row.comprador_creado_en ?? row.creado_en).toISOString(),
      pedidosCount: row.comprador_pedidos_count ?? 0
    };
  }
  if (row.rol === "VENDEDOR" && row.vendedor_id && row.nombre_comercial) {
    return {
      tipo: "VENDEDOR",
      id: row.vendedor_id,
      nombreComercial: row.nombre_comercial,
      estado: row.vendedor_estado ?? "EN_REVISION",
      creadoEn: (row.vendedor_creado_en ?? row.creado_en).toISOString(),
      bodegasCount: row.vendedor_bodegas_count ?? 0,
      productosCount: row.vendedor_productos_count ?? 0
    };
  }
  if (
    row.rol === "OPERADOR_LOGISTICO" &&
    row.operador_id &&
    row.nombre_operador
  ) {
    return {
      tipo: "OPERADOR_LOGISTICO",
      id: row.operador_id,
      nombreOperador: row.nombre_operador,
      estado: row.operador_estado ?? "INACTIVO",
      creadoEn: (row.operador_creado_en ?? row.creado_en).toISOString(),
      bodegasCount: row.operador_bodegas_count ?? 0
    };
  }
  return null;
}

function toBuyer(row: BuyerRow): AdminBuyerSummary {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nombreCompleto: row.nombre_completo,
    correoElectronico: row.correo_electronico,
    estadoComercial: row.estado_comercial,
    usuarioEstado: row.usuario_estado,
    creadoEn: row.creado_en.toISOString(),
    pedidosCount: row.pedidos_count
  };
}

function toBuyerOrder(row: BuyerOrderRow): AdminBuyerOrderView {
  return {
    id: row.id,
    numero: row.numero,
    estado: row.estado,
    estadoPago: row.estado_pago,
    moneda: row.moneda,
    totalCentavos: toInteger(row.total_centavos),
    vendedorNombre: row.vendedor_nombre,
    creadoEn: row.creado_en.toISOString()
  };
}

function toSeller(row: SellerRow): AdminSellerSummary {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nombreComercial: row.nombre_comercial,
    correoElectronico: row.correo_electronico,
    usuarioEstado: row.usuario_estado,
    estado: row.estado,
    creadoEn: row.creado_en.toISOString(),
    productosCount: row.productos_count,
    productosPublicadosCount: row.productos_publicados_count,
    bodegasCount: row.bodegas_count,
    inventarioDisponible: Number(row.inventario_disponible)
  };
}

function toWarehouse(row: WarehouseRow): AdminWarehouseView {
  return {
    id: row.id,
    nombre: row.nombre,
    ubicacion: row.ubicacion,
    tipo: row.tipo,
    estado: row.estado,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    vendedorCorreo: row.vendedor_correo,
    creadaEn: row.creada_en.toISOString(),
    productosCount: row.productos_count,
    inventarioDisponible: Number(row.inventario_disponible)
  };
}

function toWarehouseInventory(
  row: WarehouseInventoryRow
): AdminWarehouseInventoryView {
  return {
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sku: row.sku,
    onHand: row.on_hand,
    reserved: row.reserved,
    unavailable: row.unavailable,
    disponible: row.on_hand - row.reserved - row.unavailable,
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toWarehouseOperator(
  row: WarehouseOperatorRow
): AdminWarehouseOperatorView {
  return {
    id: row.id,
    nombreOperador: row.nombre_operador,
    estado: row.estado,
    asignadaEn: row.asignada_en.toISOString()
  };
}

function toMovement(row: MovementRow): AdminMovementView {
  return {
    id: row.id,
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sku: row.sku,
    bodegaId: row.bodega_id,
    bodegaNombre: row.bodega_nombre,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    tipo: row.tipo,
    cantidad: row.cantidad,
    referenciaTipo: row.referencia_tipo,
    referenciaId: row.referencia_id,
    motivo: row.motivo,
    ocurridoEn: row.ocurrido_en.toISOString()
  };
}

function toProductSummary(row: ProductRow): AdminProductSummary {
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
    imagenPrincipal: row.imagen_principal,
    imagenesCount: row.imagenes_count,
    inventarioDisponible:
      row.inventario_disponible === null
        ? null
        : Number(row.inventario_disponible),
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toProductImage(row: ProductImageRow): AdminProductImageView {
  return { id: row.id, url: row.url, alt: row.alt, orden: row.orden };
}

function toProductInventory(
  row: ProductInventoryRow
): AdminProductInventoryView {
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

function toInventory(row: InventoryRow): AdminInventoryView {
  return {
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sku: row.sku,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    bodegaId: row.bodega_id,
    bodegaNombre: row.bodega_nombre,
    onHand: row.on_hand,
    reserved: row.reserved,
    unavailable: row.unavailable,
    disponible: row.on_hand - row.reserved - row.unavailable,
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toInventoryTotals(
  row: InventoryTotalsRow | undefined
): AdminInventoryTotals {
  if (!row) {
    return {
      posiciones: 0,
      onHand: 0,
      reserved: 0,
      unavailable: 0,
      disponible: 0
    };
  }
  return {
    posiciones: row.posiciones,
    onHand: row.on_hand,
    reserved: row.reserved,
    unavailable: row.unavailable,
    disponible: row.disponible
  };
}

function toOrderSummary(row: OrderRow): AdminOrderSummary {
  return {
    id: row.id,
    numero: row.numero,
    estado: row.estado,
    estadoPago: row.estado_pago,
    moneda: row.moneda,
    totalCentavos: toInteger(row.total_centavos),
    itemsCount: row.items_count,
    compradorId: row.comprador_id,
    compradorNombre: row.comprador_nombre,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toOrderItem(row: OrderItemRow): AdminOrderItemView {
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

function toPayment(row: PaymentRow): AdminPaymentView {
  return {
    estado: row.estado,
    proveedor: row.proveedor,
    montoCentavos: toInteger(row.monto_centavos),
    moneda: row.moneda,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toPaymentSummary(row: PaymentSummaryRow): AdminPaymentSummary {
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    pedidoNumero: row.pedido_numero,
    compradorId: row.comprador_id,
    compradorNombre: row.comprador_nombre,
    vendedorNombre: row.vendedor_nombre,
    estado: row.estado,
    proveedor: row.proveedor,
    montoCentavos: toInteger(row.monto_centavos),
    moneda: row.moneda,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toReservation(row: ReservationRow): AdminReservationView {
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
): Map<string, AdminShipmentItemView[]> {
  const grouped = new Map<string, AdminShipmentItemView[]>();
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
  items: readonly AdminShipmentItemView[],
  evidence: EvidenceRow | null
): AdminShipmentView {
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
    evidencia: evidence ? toEvidence(evidence) : null
  };
}

function toEvidence(row: EvidenceRow): AdminEvidenceView {
  return {
    tipo: row.tipo,
    referencia: row.referencia,
    nota: row.nota,
    registradaEn: row.registrada_en.toISOString()
  };
}

function toHistory(row: HistoryRow): AdminHistoryView {
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

function toDelivery(
  snapshot: DireccionSnapshot | null
): AdminDeliveryView | null {
  if (!snapshot) {
    return null;
  }
  return {
    ciudad: snapshot.ciudad,
    region: snapshot.region,
    pais: snapshot.pais,
    capturadaEn: snapshot.capturadaEn
  };
}

function emptyReports(): AdminReportsView {
  return {
    usuarios: {
      total: 0,
      porRol: {
        COMPRADOR: 0,
        VENDEDOR: 0,
        OPERADOR_LOGISTICO: 0,
        ADMINISTRADOR: 0,
        SUPERVISOR: 0
      },
      porEstado: { ACTIVO: 0, INACTIVO: 0, BLOQUEADO: 0 }
    },
    compradores: {
      total: 0,
      porEstado: { HABILITADO: 0, RESTRINGIDO: 0 }
    },
    vendedores: {
      total: 0,
      porEstado: {
        EN_REVISION: 0,
        ACTIVO: 0,
        SUSPENDIDO: 0,
        INACTIVO: 0
      }
    },
    operadoresLogisticos: {
      total: 0,
      porEstado: { ACTIVO: 0, INACTIVO: 0 }
    },
    bodegas: {
      total: 0,
      porEstado: { ACTIVA: 0, INACTIVA: 0 },
      porTipo: { MARKETPLACE: 0, VENDEDOR: 0 }
    },
    catalogo: {
      total: 0,
      porEstado: {
        BORRADOR: 0,
        PUBLICADO: 0,
        SUSPENDIDO: 0,
        DESCONTINUADO: 0
      },
      porCategoria: { ELECTRONICA: 0, ROPA: 0, HOGAR: 0, DIGITAL: 0 },
      porTipoEntrega: { FISICA: 0, DIGITAL: 0 }
    },
    inventario: {
      posiciones: 0,
      onHand: 0,
      reserved: 0,
      unavailable: 0,
      disponible: 0
    },
    pedidos: {
      total: 0,
      porEstado: {
        PENDIENTE_DE_PAGO: 0,
        PAGADO: 0,
        EN_PREPARACION: 0,
        DESPACHADO: 0,
        ENTREGADO: 0,
        CANCELADO: 0,
        CERRADO: 0
      }
    },
    pagos: {
      total: 0,
      porEstado: {
        PENDIENTE: 0,
        AUTORIZADO: 0,
        CAPTURADO: 0,
        RECHAZADO: 0,
        CANCELADO: 0,
        REEMBOLSO_PARCIAL: 0,
        REEMBOLSADO: 0
      }
    },
    envios: {
      total: 0,
      porEstado: {
        PREPARACION: 0,
        EMPACADO: 0,
        DESPACHADO: 0,
        EN_TRANSITO: 0,
        ENTREGADO: 0,
        FALLIDO: 0,
        DEVUELTO: 0
      }
    }
  };
}

function readError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  return new DependencyUnavailableError(
    "No fue posible consultar la información administrativa.",
    { cause: messageOf(error) }
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
