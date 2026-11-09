import type { CategoriaProducto, TipoEntrega } from "@/features/catalog/types";
import type { EstadoPago, EstadoPedido } from "@/features/orders/types";

export type { EstadoPago, EstadoPedido } from "@/features/orders/types";

export type EstadoProductoSupervisor =
  | "BORRADOR"
  | "PUBLICADO"
  | "SUSPENDIDO"
  | "DESCONTINUADO";

export type EstadoVendedor =
  | "EN_REVISION"
  | "ACTIVO"
  | "SUSPENDIDO"
  | "INACTIVO";

export type EstadoEnvio =
  | "PREPARACION"
  | "EMPACADO"
  | "DESPACHADO"
  | "EN_TRANSITO"
  | "ENTREGADO"
  | "FALLIDO"
  | "DEVUELTO";

export type EstadoOperadorLogistico = "ACTIVO" | "INACTIVO";

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

export interface SupervisorOrderItem {
  readonly id: string;
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly tipoEntrega: TipoEntrega;
  readonly cantidad: number;
  readonly precioUnitarioCentavos: number;
  readonly moneda: string;
  readonly subtotalCentavos: number;
}

export interface SupervisorPayment {
  readonly estado: EstadoPago;
  readonly proveedor: string;
  readonly montoCentavos: number;
  readonly moneda: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface SupervisorReservation {
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

export interface SupervisorShipmentItem {
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly cantidad: number;
}

export interface SupervisorEvidence {
  readonly tipo: string;
  readonly referencia: string;
  readonly nota: string | null;
  readonly registradaEn: string;
}

export interface SupervisorShipment {
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
  readonly items: readonly SupervisorShipmentItem[];
  readonly evidencia: SupervisorEvidence | null;
}

export interface SupervisorHistoryEntry {
  readonly estadoPrevio: EstadoPedido | null;
  readonly estadoNuevo: EstadoPedido;
  readonly actorRol: string | null;
  readonly ocurridoEn: string;
  readonly referenciaTipo: string;
  readonly referenciaId: string;
  readonly correlationId: string;
}

export interface SupervisorOrderDetail extends SupervisorOrderSummary {
  readonly items: readonly SupervisorOrderItem[];
  readonly pago: SupervisorPayment | null;
  readonly reservas: readonly SupervisorReservation[];
  readonly envios: readonly SupervisorShipment[];
  readonly historial: readonly SupervisorHistoryEntry[];
}

export interface SupervisorProductInventory {
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
  readonly estado: EstadoProductoSupervisor;
  readonly tipoEntrega: TipoEntrega;
  readonly precioCentavos: number;
  readonly moneda: string;
  readonly imagenesCount: number;
  readonly inventarioDisponible: number | null;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface SupervisorProductImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly orden: number;
}

export interface SupervisorProductDetail extends SupervisorProductSummary {
  readonly descripcion: string;
  readonly imagenes: readonly SupervisorProductImage[];
  readonly inventario: readonly SupervisorProductInventory[];
}

export interface SupervisorWarehouse {
  readonly id: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly tipo: "MARKETPLACE" | "VENDEDOR";
  readonly estado: "ACTIVA" | "INACTIVA";
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
  readonly creadaEn: string;
}

export interface SupervisorInventoryPosition {
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

export interface SupervisorSeller {
  readonly id: string;
  readonly nombreComercial: string;
  readonly estado: EstadoVendedor;
  readonly creadoEn: string;
  readonly productosCount: number;
  readonly productosPublicadosCount: number;
  readonly bodegasCount: number;
  readonly inventarioDisponible: number;
}

export interface SupervisorInventoryTotals {
  readonly posiciones: number;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
}

export interface SupervisorDashboard {
  readonly pedidosTotal: number;
  readonly pedidosPorEstado: Readonly<Record<EstadoPedido, number>>;
  readonly pagosPorEstado: Readonly<Record<EstadoPago, number>>;
  readonly productosTotal: number;
  readonly productosPorEstado: Readonly<Record<EstadoProductoSupervisor, number>>;
  readonly inventario: SupervisorInventoryTotals;
  readonly almacenesTotal: number;
  readonly almacenesPorEstado: Readonly<Record<"ACTIVA" | "INACTIVA", number>>;
  readonly enviosTotal: number;
  readonly enviosPorEstado: Readonly<Record<EstadoEnvio, number>>;
  readonly vendedoresTotal: number;
  readonly vendedoresPorEstado: Readonly<Record<EstadoVendedor, number>>;
  readonly operadoresLogisticosTotal: number;
  readonly operadoresLogisticosPorEstado: Readonly<
    Record<EstadoOperadorLogistico, number>
  >;
  readonly compradoresTotal: number;
  readonly compradoresPorEstado: Readonly<
    Record<"HABILITADO" | "RESTRINGIDO", number>
  >;
}

export interface SupervisorPage<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface SupervisorDashboardEnvelope {
  readonly data: SupervisorDashboard;
}

export interface SupervisorOrderPageEnvelope {
  readonly data: SupervisorPage<SupervisorOrderSummary>;
}

export interface SupervisorOrderEnvelope {
  readonly data: SupervisorOrderDetail;
}

export interface SupervisorProductPageEnvelope {
  readonly data: SupervisorPage<SupervisorProductSummary>;
}

export interface SupervisorProductEnvelope {
  readonly data: SupervisorProductDetail;
}

export interface SupervisorWarehouseListEnvelope {
  readonly data: readonly SupervisorWarehouse[];
}

export interface SupervisorInventoryPageEnvelope {
  readonly data: SupervisorPage<SupervisorInventoryPosition>;
}

export interface SupervisorShipmentPageEnvelope {
  readonly data: SupervisorPage<SupervisorShipmentSummary>;
}

export interface SupervisorSellerPageEnvelope {
  readonly data: SupervisorPage<SupervisorSeller>;
}
