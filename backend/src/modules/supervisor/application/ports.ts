import type { CategoriaProducto } from "../../catalog/domain/producto.js";
import type { EstadoEnvio } from "../../logistics/domain/envio.js";
import type { EstadoPago, EstadoPedido } from "../../orders/application/ports.js";
import type {
  EstadoProductoVendedor,
  TipoEntregaVendedor
} from "../../seller-workspace/domain/producto-vendedor.js";
import type { EstadoVendedor } from "../../seller-workspace/application/ports.js";

/**
 * Puertos de consulta del Supervisor (`SUP-01`).
 *
 * El Supervisor es un perfil de consulta y seguimiento: este puerto expone
 * únicamente lecturas. No existe ningún método de escritura, ni acceso a
 * credenciales, documentos de identidad, correos personales ni direcciones de
 * entrega. Los identificadores que se publican son operativos y los nombres de
 * vendedor son comerciales.
 */

export const ESTADOS_PEDIDO_SUPERVISOR: readonly EstadoPedido[] = [
  "PENDIENTE_DE_PAGO",
  "PAGADO",
  "EN_PREPARACION",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
  "CERRADO"
];

export const ESTADOS_PAGO_SUPERVISOR: readonly EstadoPago[] = [
  "PENDIENTE",
  "AUTORIZADO",
  "CAPTURADO",
  "RECHAZADO",
  "CANCELADO",
  "REEMBOLSO_PARCIAL",
  "REEMBOLSADO"
];

export const ESTADOS_PRODUCTO_SUPERVISOR: readonly EstadoProductoVendedor[] = [
  "BORRADOR",
  "PUBLICADO",
  "SUSPENDIDO",
  "DESCONTINUADO"
];

export const ESTADOS_VENDEDOR_SUPERVISOR: readonly EstadoVendedor[] = [
  "EN_REVISION",
  "ACTIVO",
  "SUSPENDIDO",
  "INACTIVO"
];

export const ESTADOS_ENVIO_SUPERVISOR: readonly EstadoEnvio[] = [
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

export interface SupervisorPage<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface SupervisorOrderFilter {
  readonly estado: EstadoPedido | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface SupervisorProductFilter {
  readonly estado: EstadoProductoVendedor | null;
  readonly categoria: CategoriaProducto | null;
  readonly vendedorId: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface SupervisorInventoryFilter {
  readonly bodegaId: string | null;
  readonly productoId: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface SupervisorShipmentFilter {
  readonly estado: EstadoEnvio | null;
  readonly pedidoId: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface SupervisorSellerFilter {
  readonly estado: EstadoVendedor | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface SupervisorOrderSummary {
  readonly id: string;
  readonly numero: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly itemsCount: number;
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface SupervisorOrderItemView {
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
export interface SupervisorPaymentView {
  readonly estado: EstadoPago;
  readonly proveedor: string;
  readonly montoCentavos: number;
  readonly moneda: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface SupervisorReservationView {
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

export interface SupervisorShipmentItemView {
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly cantidad: number;
}

export interface SupervisorEvidenceView {
  readonly tipo: string;
  readonly referencia: string;
  readonly nota: string | null;
  readonly registradaEn: string;
}

export interface SupervisorShipmentView {
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
  readonly items: readonly SupervisorShipmentItemView[];
  readonly evidencia: SupervisorEvidenceView | null;
}

/**
 * Evento del historial del pedido. Se publica el rol del actor y la referencia
 * causal, no el identificador del usuario ni su nombre.
 */
export interface SupervisorHistoryView {
  readonly estadoPrevio: EstadoPedido | null;
  readonly estadoNuevo: EstadoPedido;
  readonly actorRol: string | null;
  readonly ocurridoEn: string;
  readonly referenciaTipo: string;
  readonly referenciaId: string;
  readonly correlationId: string;
}

export interface SupervisorOrderDetail extends SupervisorOrderSummary {
  readonly items: readonly SupervisorOrderItemView[];
  readonly pago: SupervisorPaymentView | null;
  readonly reservas: readonly SupervisorReservationView[];
  readonly envios: readonly SupervisorShipmentView[];
  readonly historial: readonly SupervisorHistoryView[];
}

export interface SupervisorProductInventoryView {
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface SupervisorProductSummary {
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
  readonly imagenesCount: number;
  /** Suma de unidades disponibles en todas las bodegas; `null` si es digital. */
  readonly inventarioDisponible: number | null;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface SupervisorProductImageView {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly orden: number;
}

export interface SupervisorProductDetail extends SupervisorProductSummary {
  readonly descripcion: string;
  readonly imagenes: readonly SupervisorProductImageView[];
  readonly inventario: readonly SupervisorProductInventoryView[];
}

export interface SupervisorWarehouseView {
  readonly id: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly tipo: "MARKETPLACE" | "VENDEDOR";
  readonly estado: "ACTIVA" | "INACTIVA";
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
  readonly creadaEn: string;
}

export interface SupervisorInventoryView {
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface SupervisorShipmentSummary {
  readonly id: string;
  readonly pedidoId: string;
  readonly pedidoNumero: string;
  readonly bodegaOrigenId: string;
  readonly bodegaNombre: string;
  readonly transportista: string | null;
  readonly trackingNumber: string | null;
  readonly estado: EstadoEnvio;
  readonly creadoEn: string;
  readonly despachadoEn: string | null;
  readonly entregadoEn: string | null;
}

export interface SupervisorSellerView {
  readonly id: string;
  readonly nombreComercial: string;
  readonly estado: EstadoVendedor;
  readonly creadoEn: string;
  readonly productosCount: number;
  readonly productosPublicadosCount: number;
  readonly bodegasCount: number;
  /** Suma de unidades disponibles en las bodegas del vendedor. */
  readonly inventarioDisponible: number;
}

export interface SupervisorInventoryTotals {
  readonly posiciones: number;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
}

/**
 * Resumen del dashboard construido únicamente con conteos directos de estados
 * definidos y con la suma de inventario definida en `INV-03`. No incluye
 * porcentajes, metas, SLA, rankings, proyecciones ni comparaciones temporales.
 */
export interface SupervisorDashboardView {
  readonly pedidosTotal: number;
  readonly pedidosPorEstado: Readonly<Record<EstadoPedido, number>>;
  readonly pagosPorEstado: Readonly<Record<EstadoPago, number>>;
  readonly productosTotal: number;
  readonly productosPorEstado: Readonly<Record<EstadoProductoVendedor, number>>;
  readonly inventario: SupervisorInventoryTotals;
  readonly almacenesTotal: number;
  readonly almacenesPorEstado: Readonly<Record<"ACTIVA" | "INACTIVA", number>>;
  readonly enviosTotal: number;
  readonly enviosPorEstado: Readonly<Record<EstadoEnvio, number>>;
  readonly vendedoresTotal: number;
  readonly vendedoresPorEstado: Readonly<Record<EstadoVendedor, number>>;
  readonly operadoresLogisticosTotal: number;
  readonly operadoresLogisticosPorEstado: Readonly<Record<"ACTIVO" | "INACTIVO", number>>;
  readonly compradoresTotal: number;
  readonly compradoresPorEstado: Readonly<Record<"HABILITADO" | "RESTRINGIDO", number>>;
}

/**
 * Puerto de solo lectura. Un supervisor nunca escribe a través de este puerto:
 * no hay `INSERT`, `UPDATE` ni `DELETE` en la implementación.
 */
export interface SupervisorStore {
  dashboard(): Promise<SupervisorDashboardView>;

  listOrders(filter: SupervisorOrderFilter): Promise<SupervisorPage<SupervisorOrderSummary>>;
  findOrder(orderId: string): Promise<SupervisorOrderDetail | null>;

  listProducts(
    filter: SupervisorProductFilter
  ): Promise<SupervisorPage<SupervisorProductSummary>>;
  findProduct(productId: string): Promise<SupervisorProductDetail | null>;

  listWarehouses(): Promise<SupervisorWarehouseView[]>;

  listInventory(
    filter: SupervisorInventoryFilter
  ): Promise<SupervisorPage<SupervisorInventoryView>>;

  listShipments(
    filter: SupervisorShipmentFilter
  ): Promise<SupervisorPage<SupervisorShipmentSummary>>;

  listSellers(
    filter: SupervisorSellerFilter
  ): Promise<SupervisorPage<SupervisorSellerView>>;

  healthCheck(): Promise<void>;
  close(): Promise<void>;
}
