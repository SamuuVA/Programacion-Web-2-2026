import type { CategoriaProducto } from "../../catalog/domain/producto.js";
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

/**
 * Puertos de consulta del Administrador.
 *
 * El Administrador conserva las dos altas administrativas ya existentes
 * (`POST /api/v1/admin/sellers` y `POST /api/v1/admin/logistics-operators`).
 * Este puerto solo declara lecturas: no hay métodos de escritura, de cambio de
 * rol, de estado, de pagos ni de inventario. Tampoco expone credenciales,
 * hashes, tokens, documentos de identidad ni direcciones de entrega completas.
 */

export const ROLES_ADMIN: readonly RolSistema[] = [
  "COMPRADOR",
  "VENDEDOR",
  "OPERADOR_LOGISTICO",
  "ADMINISTRADOR",
  "SUPERVISOR"
];

export const ESTADOS_USUARIO_ADMIN: readonly EstadoUsuario[] = [
  "ACTIVO",
  "INACTIVO",
  "BLOQUEADO"
];

export const ESTADOS_COMPRADOR_ADMIN: readonly (
  "HABILITADO" | "RESTRINGIDO"
)[] = ["HABILITADO", "RESTRINGIDO"];

export const ESTADOS_VENDEDOR_ADMIN: readonly EstadoVendedor[] = [
  "EN_REVISION",
  "ACTIVO",
  "SUSPENDIDO",
  "INACTIVO"
];

export const ESTADOS_OPERADOR_ADMIN: readonly ("ACTIVO" | "INACTIVO")[] = [
  "ACTIVO",
  "INACTIVO"
];

export const ESTADOS_BODEGA_ADMIN: readonly ("ACTIVA" | "INACTIVA")[] = [
  "ACTIVA",
  "INACTIVA"
];

export const TIPOS_BODEGA_ADMIN: readonly ("MARKETPLACE" | "VENDEDOR")[] = [
  "MARKETPLACE",
  "VENDEDOR"
];

export const ESTADOS_PRODUCTO_ADMIN: readonly EstadoProductoVendedor[] = [
  "BORRADOR",
  "PUBLICADO",
  "SUSPENDIDO",
  "DESCONTINUADO"
];

export const TIPOS_ENTREGA_ADMIN: readonly TipoEntregaVendedor[] = [
  "FISICA",
  "DIGITAL"
];

export const ESTADOS_PEDIDO_ADMIN: readonly EstadoPedido[] = [
  "PENDIENTE_DE_PAGO",
  "PAGADO",
  "EN_PREPARACION",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
  "CERRADO"
];

export const ESTADOS_PAGO_ADMIN: readonly EstadoPago[] = [
  "PENDIENTE",
  "AUTORIZADO",
  "CAPTURADO",
  "RECHAZADO",
  "CANCELADO",
  "REEMBOLSO_PARCIAL",
  "REEMBOLSADO"
];

export const ESTADOS_ENVIO_ADMIN: readonly EstadoEnvio[] = [
  "PREPARACION",
  "EMPACADO",
  "DESPACHADO",
  "EN_TRANSITO",
  "ENTREGADO",
  "FALLIDO",
  "DEVUELTO"
];

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

export interface AdminPage<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminUserFilter {
  readonly rol: RolSistema | null;
  readonly estado: EstadoUsuario | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminBuyerFilter {
  readonly estadoComercial: "HABILITADO" | "RESTRINGIDO" | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminSellerFilter {
  readonly estado: EstadoVendedor | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminWarehouseFilter {
  readonly estado: "ACTIVA" | "INACTIVA" | null;
  readonly vendedorId: string | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminProductFilter {
  readonly estado: EstadoProductoVendedor | null;
  readonly categoria: CategoriaProducto | null;
  readonly tipoEntrega: TipoEntregaVendedor | null;
  readonly vendedorId: string | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminInventoryFilter {
  readonly bodegaId: string | null;
  readonly productoId: string | null;
  readonly vendedorId: string | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminMovementFilter {
  readonly bodegaId: string | null;
  readonly productoId: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminOrderFilter {
  readonly estado: EstadoPedido | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminPaymentFilter {
  readonly estado: EstadoPago | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminUserSummary {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly rol: RolSistema;
  readonly estado: EstadoUsuario;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
  /** Identificador del perfil de dominio, cuando el rol tiene uno. */
  readonly perfilId: string | null;
}

export type AdminUserProfile =
  | {
      readonly tipo: "COMPRADOR";
      readonly id: string;
      readonly estadoComercial: "HABILITADO" | "RESTRINGIDO";
      readonly creadoEn: string;
      readonly pedidosCount: number;
    }
  | {
      readonly tipo: "VENDEDOR";
      readonly id: string;
      readonly nombreComercial: string;
      readonly estado: EstadoVendedor;
      readonly creadoEn: string;
      readonly bodegasCount: number;
      readonly productosCount: number;
    }
  | {
      readonly tipo: "OPERADOR_LOGISTICO";
      readonly id: string;
      readonly nombreOperador: string;
      readonly estado: "ACTIVO" | "INACTIVO";
      readonly creadoEn: string;
      readonly bodegasCount: number;
    };

export interface AdminUserDetail extends AdminUserSummary {
  readonly perfil: AdminUserProfile | null;
}

export interface AdminBuyerSummary {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly estadoComercial: "HABILITADO" | "RESTRINGIDO";
  readonly usuarioEstado: EstadoUsuario;
  readonly creadoEn: string;
  readonly pedidosCount: number;
}

export interface AdminBuyerOrderView {
  readonly id: string;
  readonly numero: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly vendedorNombre: string;
  readonly creadoEn: string;
}

export interface AdminBuyerDetail extends AdminBuyerSummary {
  readonly pedidos: readonly AdminBuyerOrderView[];
}

export interface AdminSellerSummary {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreComercial: string;
  readonly correoElectronico: string;
  readonly usuarioEstado: EstadoUsuario;
  readonly estado: EstadoVendedor;
  readonly creadoEn: string;
  readonly productosCount: number;
  readonly productosPublicadosCount: number;
  readonly bodegasCount: number;
  /** Suma de unidades disponibles en las bodegas del vendedor. */
  readonly inventarioDisponible: number;
}

export interface AdminInventoryTotals {
  readonly posiciones: number;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
}

export interface AdminWarehouseView {
  readonly id: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly tipo: "MARKETPLACE" | "VENDEDOR";
  readonly estado: "ACTIVA" | "INACTIVA";
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
  readonly vendedorCorreo: string | null;
  readonly creadaEn: string;
  readonly productosCount: number;
  readonly inventarioDisponible: number;
}

export interface AdminSellerDetail extends AdminSellerSummary {
  readonly bodegas: readonly AdminWarehouseView[];
  readonly productos: readonly AdminProductSummary[];
  readonly inventario: AdminInventoryTotals;
  readonly pedidosCount: number;
}

export interface AdminWarehouseInventoryView {
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface AdminWarehouseOperatorView {
  readonly id: string;
  readonly nombreOperador: string;
  readonly estado: "ACTIVO" | "INACTIVO";
  readonly asignadaEn: string;
}

export interface AdminMovementView {
  readonly id: string;
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly tipo: string;
  readonly cantidad: number;
  readonly referenciaTipo: string;
  readonly referenciaId: string;
  readonly motivo: string | null;
  readonly ocurridoEn: string;
}

export interface AdminWarehouseDetail extends AdminWarehouseView {
  readonly inventario: readonly AdminWarehouseInventoryView[];
  readonly movimientos: readonly AdminMovementView[];
  readonly operadores: readonly AdminWarehouseOperatorView[];
}

export interface AdminProductImageView {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly orden: number;
}

export interface AdminProductInventoryView {
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface AdminProductSummary {
  readonly id: string;
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly nombre: string;
  readonly sku: string;
  readonly categoria: CategoriaProducto;
  readonly estado: EstadoProductoVendedor;
  readonly tipoEntrega: TipoEntregaVendedor;
  readonly precioCentavos: number;
  readonly moneda: string;
  readonly imagenPrincipal: string | null;
  readonly imagenesCount: number;
  /** Suma de unidades disponibles; `null` si el producto es digital. */
  readonly inventarioDisponible: number | null;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface AdminProductDetail extends AdminProductSummary {
  readonly descripcion: string;
  readonly imagenes: readonly AdminProductImageView[];
  readonly inventario: readonly AdminProductInventoryView[];
}

export interface AdminInventoryView {
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface AdminOrderSummary {
  readonly id: string;
  readonly numero: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly itemsCount: number;
  readonly compradorId: string;
  readonly compradorNombre: string;
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface AdminOrderItemView {
  readonly id: string;
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly tipoEntrega: TipoEntregaVendedor;
  readonly cantidad: number;
  readonly precioUnitarioCentavos: number;
  readonly moneda: string;
  readonly subtotalCentavos: number;
}

/** Pago observado. Se omite la referencia del proveedor por minimización. */
export interface AdminPaymentView {
  readonly estado: EstadoPago;
  readonly proveedor: string;
  readonly montoCentavos: number;
  readonly moneda: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface AdminReservationView {
  readonly id: string;
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly cantidad: number;
  readonly estado: "ACTIVA" | "LIBERADA" | "CONSUMIDA";
  readonly creadaEn: string;
}

export interface AdminShipmentItemView {
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly cantidad: number;
}

export interface AdminEvidenceView {
  readonly tipo: string;
  readonly referencia: string;
  readonly nota: string | null;
  readonly registradaEn: string;
}

export interface AdminShipmentView {
  readonly id: string;
  readonly pedidoId: string;
  readonly bodegaOrigenId: string;
  readonly bodegaNombre: string;
  readonly transportista: string | null;
  readonly trackingNumber: string | null;
  readonly estado: EstadoEnvio;
  readonly creadoEn: string;
  readonly despachadoEn: string | null;
  readonly entregadoEn: string | null;
  readonly items: readonly AdminShipmentItemView[];
  readonly evidencia: AdminEvidenceView | null;
}

export interface AdminHistoryView {
  readonly estadoPrevio: EstadoPedido | null;
  readonly estadoNuevo: EstadoPedido;
  readonly actorRol: string | null;
  readonly ocurridoEn: string;
  readonly referenciaTipo: string;
  readonly referenciaId: string;
  readonly correlationId: string;
}

/** Datos de entrega minimizados: solo ubicación administrativa, sin contacto. */
export interface AdminDeliveryView {
  readonly ciudad: string;
  readonly region: string;
  readonly pais: string;
  readonly capturadaEn: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  readonly items: readonly AdminOrderItemView[];
  readonly pago: AdminPaymentView | null;
  readonly reservas: readonly AdminReservationView[];
  readonly envios: readonly AdminShipmentView[];
  readonly historial: readonly AdminHistoryView[];
  readonly entrega: AdminDeliveryView | null;
}

export interface AdminPaymentSummary {
  readonly id: string;
  readonly pedidoId: string;
  readonly pedidoNumero: string;
  readonly compradorId: string;
  readonly compradorNombre: string;
  readonly vendedorNombre: string;
  readonly estado: EstadoPago;
  readonly proveedor: string;
  readonly montoCentavos: number;
  readonly moneda: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface AdminUsersReport {
  readonly total: number;
  readonly porRol: Readonly<Record<RolSistema, number>>;
  readonly porEstado: Readonly<Record<EstadoUsuario, number>>;
}

export interface AdminCountReport<E extends string> {
  readonly total: number;
  readonly porEstado: Readonly<Record<E, number>>;
}

/**
 * Reportes administrativos construidos únicamente con conteos directos y la
 * suma de inventario definida en `INV-03`. No incluye porcentajes, metas, SLA,
 * rankings, proyecciones, comisiones ni información financiera derivada.
 */
export interface AdminReportsView {
  readonly usuarios: AdminUsersReport;
  readonly compradores: AdminCountReport<"HABILITADO" | "RESTRINGIDO">;
  readonly vendedores: AdminCountReport<EstadoVendedor>;
  readonly operadoresLogisticos: AdminCountReport<"ACTIVO" | "INACTIVO">;
  readonly bodegas: {
    readonly total: number;
    readonly porEstado: Readonly<Record<"ACTIVA" | "INACTIVA", number>>;
    readonly porTipo: Readonly<Record<"MARKETPLACE" | "VENDEDOR", number>>;
  };
  readonly catalogo: {
    readonly total: number;
    readonly porEstado: Readonly<Record<EstadoProductoVendedor, number>>;
    readonly porCategoria: Readonly<Record<CategoriaProducto, number>>;
    readonly porTipoEntrega: Readonly<Record<TipoEntregaVendedor, number>>;
  };
  readonly inventario: AdminInventoryTotals;
  readonly pedidos: AdminCountReport<EstadoPedido>;
  readonly pagos: AdminCountReport<EstadoPago>;
  readonly envios: AdminCountReport<EstadoEnvio>;
}

export interface AdminDashboardView extends AdminReportsView {
  readonly recientes: {
    readonly usuarios: readonly AdminUserSummary[];
    readonly compradores: readonly AdminBuyerSummary[];
    readonly vendedores: readonly AdminSellerSummary[];
    readonly pedidos: readonly AdminOrderSummary[];
  };
}

export interface AdminStore {
  dashboard(): Promise<AdminDashboardView>;
  reports(): Promise<AdminReportsView>;

  listUsers(filter: AdminUserFilter): Promise<AdminPage<AdminUserSummary>>;
  findUser(userId: string): Promise<AdminUserDetail | null>;

  listBuyers(filter: AdminBuyerFilter): Promise<AdminPage<AdminBuyerSummary>>;
  findBuyer(buyerId: string): Promise<AdminBuyerDetail | null>;

  listSellers(
    filter: AdminSellerFilter
  ): Promise<AdminPage<AdminSellerSummary>>;
  findSeller(sellerId: string): Promise<AdminSellerDetail | null>;

  listWarehouses(
    filter: AdminWarehouseFilter
  ): Promise<AdminPage<AdminWarehouseView>>;
  findWarehouse(warehouseId: string): Promise<AdminWarehouseDetail | null>;

  listProducts(
    filter: AdminProductFilter
  ): Promise<AdminPage<AdminProductSummary>>;
  findProduct(productId: string): Promise<AdminProductDetail | null>;

  listInventory(
    filter: AdminInventoryFilter
  ): Promise<AdminPage<AdminInventoryView>>;
  listMovements(
    filter: AdminMovementFilter
  ): Promise<AdminPage<AdminMovementView>>;

  listOrders(filter: AdminOrderFilter): Promise<AdminPage<AdminOrderSummary>>;
  findOrder(orderId: string): Promise<AdminOrderDetail | null>;

  listPayments(
    filter: AdminPaymentFilter
  ): Promise<AdminPage<AdminPaymentSummary>>;

  healthCheck(): Promise<void>;
  close(): Promise<void>;
}
