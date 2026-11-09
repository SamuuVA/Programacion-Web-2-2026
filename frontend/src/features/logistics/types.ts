import type { TipoEntrega } from "@/features/catalog/types";
import type { AddressSnapshot, EstadoPago, EstadoPedido } from "@/features/orders/types";

export type EstadoOperadorLogistico = "ACTIVO" | "INACTIVO";

export type EstadoEnvio =
  | "PREPARACION"
  | "EMPACADO"
  | "DESPACHADO"
  | "EN_TRANSITO"
  | "ENTREGADO"
  | "FALLIDO"
  | "DEVUELTO";

export type ResultadoEntrega = "ENTREGADO" | "FALLIDO";

export interface LogisticsWarehouse {
  readonly id: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly tipo: "MARKETPLACE" | "VENDEDOR";
  readonly estado: "ACTIVA" | "INACTIVA";
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
}

export interface LogisticsProfile {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreOperador: string;
  readonly estado: EstadoOperadorLogistico;
  readonly creadoEn: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly bodegas: readonly LogisticsWarehouse[];
}

export interface LogisticsInventoryPosition {
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface LogisticsSummary {
  readonly pedidosEnPreparacion: number;
  readonly enviosPorPreparar: number;
  readonly enviosDespachados: number;
  readonly enviosEntregados: number;
  readonly enviosConFallo: number;
  readonly bodegasAsignadas: number;
}

export interface LogisticsOrderItem {
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

export interface LogisticsReservation {
  readonly id: string;
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly cantidad: number;
  readonly estado: "ACTIVA" | "LIBERADA" | "CONSUMIDA";
}

export interface LogisticsShipmentItem {
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly cantidad: number;
}

export interface LogisticsEvidence {
  readonly tipo: string;
  readonly referencia: string;
  readonly nota: string | null;
  readonly registradaEn: string;
}

export interface LogisticsShipment {
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
  readonly items: readonly LogisticsShipmentItem[];
  readonly evidencia: LogisticsEvidence | null;
}

export interface LogisticsHistoryEntry {
  readonly estadoPrevio: EstadoPedido | null;
  readonly estadoNuevo: EstadoPedido;
  readonly actorId: string | null;
  readonly actorRol: string | null;
  readonly ocurridoEn: string;
  readonly referenciaTipo: string;
  readonly referenciaId: string;
  readonly correlationId: string;
}

export interface LogisticsOrderSummary {
  readonly id: string;
  readonly numero: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly itemsCount: number;
  readonly creadoEn: string;
  readonly vendedorNombre: string;
  readonly bodegasCount: number;
  readonly enviosCount: number;
  readonly reservasActivas: number;
}

export interface LogisticsOrderDetail extends LogisticsOrderSummary {
  readonly direccionEntrega: AddressSnapshot | null;
  readonly items: readonly LogisticsOrderItem[];
  readonly reservas: readonly LogisticsReservation[];
  readonly envios: readonly LogisticsShipment[];
  readonly historial: readonly LogisticsHistoryEntry[];
}

export interface PrepareShipmentResult {
  readonly envio: LogisticsShipment;
  readonly pedido: LogisticsOrderDetail;
  readonly duplicado: boolean;
}

export interface DispatchShipmentResult {
  readonly envio: LogisticsShipment;
  readonly pedido: LogisticsOrderDetail;
  readonly movimientoIds: readonly string[];
  readonly duplicado: boolean;
}

export interface DeliveryResult {
  readonly envio: LogisticsShipment;
  readonly pedido: LogisticsOrderDetail;
  readonly duplicado: boolean;
}

export interface LogisticsProfileEnvelope {
  readonly data: LogisticsProfile;
}

export interface LogisticsWarehouseListEnvelope {
  readonly data: readonly LogisticsWarehouse[];
}

export interface LogisticsInventoryListEnvelope {
  readonly data: readonly LogisticsInventoryPosition[];
}

export interface LogisticsSummaryEnvelope {
  readonly data: LogisticsSummary;
}

export interface LogisticsOrderListEnvelope {
  readonly data: readonly LogisticsOrderSummary[];
}

export interface LogisticsOrderEnvelope {
  readonly data: LogisticsOrderDetail;
}

export interface PrepareShipmentEnvelope {
  readonly data: PrepareShipmentResult;
}

export interface DispatchShipmentEnvelope {
  readonly data: DispatchShipmentResult;
}

export interface DeliveryEnvelope {
  readonly data: DeliveryResult;
}
