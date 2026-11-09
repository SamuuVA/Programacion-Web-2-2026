import type { TipoEntrega } from "@/features/catalog/types";

export type EstadoPedido =
  | "PENDIENTE_DE_PAGO"
  | "PAGADO"
  | "EN_PREPARACION"
  | "DESPACHADO"
  | "ENTREGADO"
  | "CANCELADO"
  | "CERRADO";

export type EstadoPago =
  | "PENDIENTE"
  | "AUTORIZADO"
  | "CAPTURADO"
  | "RECHAZADO"
  | "CANCELADO"
  | "REEMBOLSO_PARCIAL"
  | "REEMBOLSADO";

export type ResultadoPagoSimulado = "CONFIRMADO" | "RECHAZADO" | "DESCONOCIDO";

export interface OrderItem {
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

export interface Payment {
  readonly id: string;
  readonly estado: EstadoPago;
  readonly proveedor: string;
  readonly referencia: string | null;
  readonly montoCentavos: number;
  readonly moneda: string;
}

export interface AddressSnapshot {
  readonly direccionId: string;
  readonly destinatario: string;
  readonly telefono: string;
  readonly linea1: string;
  readonly linea2: string | null;
  readonly ciudad: string;
  readonly region: string;
  readonly codigoPostal: string | null;
  readonly pais: string;
  readonly capturadaEn: string;
}

export interface OrderSummary {
  readonly id: string;
  readonly numero: string;
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly itemsCount: number;
  readonly creadoEn: string;
}

export interface OrderDetail extends OrderSummary {
  readonly items: readonly OrderItem[];
  readonly pago: Payment | null;
  readonly direccionEntrega: AddressSnapshot | null;
}

export interface CheckoutResult {
  readonly estado: ResultadoPagoSimulado;
  readonly checkoutId: string;
  readonly pedidos: readonly OrderDetail[];
  readonly mensaje: string;
}

export interface CheckoutEnvelope {
  readonly data: CheckoutResult;
}

export interface OrderListEnvelope {
  readonly data: readonly OrderSummary[];
}

export interface OrderEnvelope {
  readonly data: OrderDetail;
}
