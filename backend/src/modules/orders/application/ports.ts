import type { DireccionSnapshot } from "../../buyers/domain/direccion-entrega.js";

export const RESULTADOS_PAGO_SIMULADO = [
  "CONFIRMADO",
  "RECHAZADO",
  "DESCONOCIDO"
] as const;

export type ResultadoPagoSimulado = (typeof RESULTADOS_PAGO_SIMULADO)[number];

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

export interface OrderItemView {
  readonly id: string;
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly tipoEntrega: "FISICA" | "DIGITAL";
  readonly cantidad: number;
  readonly precioUnitarioCentavos: number;
  readonly moneda: string;
  readonly subtotalCentavos: number;
}

export interface PaymentView {
  readonly id: string;
  readonly estado: EstadoPago;
  readonly proveedor: string;
  readonly referencia: string | null;
  readonly montoCentavos: number;
  readonly moneda: string;
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
  readonly items: readonly OrderItemView[];
  readonly pago: PaymentView | null;
  readonly direccionEntrega: DireccionSnapshot | null;
}

export interface CheckoutResult {
  readonly estado: ResultadoPagoSimulado;
  readonly checkoutId: string;
  readonly pedidos: readonly OrderDetail[];
  readonly mensaje: string;
}

export interface CheckoutCommand {
  readonly compradorId: string;
  readonly idempotencyKey: string;
  readonly direccionEntregaId: string | null;
  readonly confirmarPrecio: boolean;
  readonly resultadoPagoSimulado: ResultadoPagoSimulado;
  readonly correlationId: string;
  readonly now: string;
}

/**
 * Frontera transaccional del checkout.
 *
 * `executeCheckout` debe validar carrito, precios, estados y stock; crear los
 * pedidos; reservar inventario; simular el pago y registrar el intento de forma
 * idempotente en una única transacción PostgreSQL.
 */
export interface CheckoutStore {
  executeCheckout(command: CheckoutCommand): Promise<CheckoutResult>;
  listOrders(compradorId: string): Promise<OrderSummary[]>;
  findOrder(compradorId: string, orderId: string): Promise<OrderDetail | null>;
  close(): Promise<void>;
}
