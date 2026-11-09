import type {
  AddressId,
  AuditId,
  CarritoId,
  CheckoutId,
  CompradorId,
  EventId,
  InventarioId,
  MovimientoInventarioId,
  OrderId,
  OrderItemId,
  OrderStatusHistoryId,
  PaymentId,
  ProductImageId,
  ProductoId,
  ReservationId,
  SellerId,
  SessionId,
  ShipmentEventId,
  ShipmentId,
  ShipmentItemId,
  DeliveryEvidenceId,
  LogisticsOperationId,
  LogisticsOperatorId,
  UsuarioId,
  WarehouseId
} from "../domain/ids.js";
import type { Instant } from "../domain/value-objects.js";

export interface Clock {
  now(): Instant;
}

export interface IdGenerator {
  usuarioId(): UsuarioId;
  compradorId(): CompradorId;
  carritoId(): CarritoId;
  auditId(): AuditId;
  eventId(): EventId;
  sessionId(): SessionId;
  sellerId(): SellerId;
  warehouseId(): WarehouseId;
  addressId(): AddressId;
  checkoutId(): CheckoutId;
  orderId(): OrderId;
  orderItemId(): OrderItemId;
  paymentId(): PaymentId;
  reservationId(): ReservationId;
  productoId(): ProductoId;
  productImageId(): ProductImageId;
  inventarioId(): InventarioId;
  movimientoInventarioId(): MovimientoInventarioId;
  logisticsOperatorId(): LogisticsOperatorId;
  shipmentId(): ShipmentId;
  shipmentItemId(): ShipmentItemId;
  shipmentEventId(): ShipmentEventId;
  deliveryEvidenceId(): DeliveryEvidenceId;
  orderStatusHistoryId(): OrderStatusHistoryId;
  logisticsOperationId(): LogisticsOperationId;
}

export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(hash: string, plainPassword: string): Promise<boolean>;
}

export interface SessionTokenGenerator {
  generate(): { token: string; tokenHash: string };
}
