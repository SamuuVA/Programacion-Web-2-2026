type Brand<T, B extends string> = T & { readonly __brand: B };

export type UsuarioId = Brand<string, "UsuarioId">;
export type CompradorId = Brand<string, "CompradorId">;
export type CarritoId = Brand<string, "CarritoId">;
export type AuditId = Brand<string, "AuditId">;
export type EventId = Brand<string, "EventId">;
export type SessionId = Brand<string, "SessionId">;
export type SellerId = Brand<string, "SellerId">;
export type WarehouseId = Brand<string, "WarehouseId">;
export type AddressId = Brand<string, "AddressId">;
export type CheckoutId = Brand<string, "CheckoutId">;
export type OrderId = Brand<string, "OrderId">;
export type OrderItemId = Brand<string, "OrderItemId">;
export type PaymentId = Brand<string, "PaymentId">;
export type ReservationId = Brand<string, "ReservationId">;
export type ProductoId = Brand<string, "ProductoId">;
export type ProductImageId = Brand<string, "ProductImageId">;
export type InventarioId = Brand<string, "InventarioId">;
export type MovimientoInventarioId = Brand<string, "MovimientoInventarioId">;
export type LogisticsOperatorId = Brand<string, "LogisticsOperatorId">;
export type ShipmentId = Brand<string, "ShipmentId">;
export type ShipmentItemId = Brand<string, "ShipmentItemId">;
export type ShipmentEventId = Brand<string, "ShipmentEventId">;
export type DeliveryEvidenceId = Brand<string, "DeliveryEvidenceId">;
export type OrderStatusHistoryId = Brand<string, "OrderStatusHistoryId">;
export type LogisticsOperationId = Brand<string, "LogisticsOperationId">;

export function usuarioId(value: string): UsuarioId {
  return nonEmptyId(value, "UsuarioId") as UsuarioId;
}

export function compradorId(value: string): CompradorId {
  return nonEmptyId(value, "CompradorId") as CompradorId;
}

export function carritoId(value: string): CarritoId {
  return nonEmptyId(value, "CarritoId") as CarritoId;
}

export function auditId(value: string): AuditId {
  return nonEmptyId(value, "AuditId") as AuditId;
}

export function eventId(value: string): EventId {
  return nonEmptyId(value, "EventId") as EventId;
}

export function sessionId(value: string): SessionId {
  return nonEmptyId(value, "SessionId") as SessionId;
}

export function sellerId(value: string): SellerId {
  return nonEmptyId(value, "SellerId") as SellerId;
}

export function warehouseId(value: string): WarehouseId {
  return nonEmptyId(value, "WarehouseId") as WarehouseId;
}

export function addressId(value: string): AddressId {
  return nonEmptyId(value, "AddressId") as AddressId;
}

export function checkoutId(value: string): CheckoutId {
  return nonEmptyId(value, "CheckoutId") as CheckoutId;
}

export function orderId(value: string): OrderId {
  return nonEmptyId(value, "OrderId") as OrderId;
}

export function orderItemId(value: string): OrderItemId {
  return nonEmptyId(value, "OrderItemId") as OrderItemId;
}

export function paymentId(value: string): PaymentId {
  return nonEmptyId(value, "PaymentId") as PaymentId;
}

export function reservationId(value: string): ReservationId {
  return nonEmptyId(value, "ReservationId") as ReservationId;
}

export function productoId(value: string): ProductoId {
  return nonEmptyId(value, "ProductoId") as ProductoId;
}

export function productImageId(value: string): ProductImageId {
  return nonEmptyId(value, "ProductImageId") as ProductImageId;
}

export function inventarioId(value: string): InventarioId {
  return nonEmptyId(value, "InventarioId") as InventarioId;
}

export function movimientoInventarioId(value: string): MovimientoInventarioId {
  return nonEmptyId(value, "MovimientoInventarioId") as MovimientoInventarioId;
}

export function logisticsOperatorId(value: string): LogisticsOperatorId {
  return nonEmptyId(value, "LogisticsOperatorId") as LogisticsOperatorId;
}

export function shipmentId(value: string): ShipmentId {
  return nonEmptyId(value, "ShipmentId") as ShipmentId;
}

export function shipmentItemId(value: string): ShipmentItemId {
  return nonEmptyId(value, "ShipmentItemId") as ShipmentItemId;
}

export function shipmentEventId(value: string): ShipmentEventId {
  return nonEmptyId(value, "ShipmentEventId") as ShipmentEventId;
}

export function deliveryEvidenceId(value: string): DeliveryEvidenceId {
  return nonEmptyId(value, "DeliveryEvidenceId") as DeliveryEvidenceId;
}

export function orderStatusHistoryId(value: string): OrderStatusHistoryId {
  return nonEmptyId(value, "OrderStatusHistoryId") as OrderStatusHistoryId;
}

export function logisticsOperationId(value: string): LogisticsOperationId {
  return nonEmptyId(value, "LogisticsOperationId") as LogisticsOperationId;
}

function nonEmptyId(value: string, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} no puede estar vacío.`);
  }
  return value;
}
