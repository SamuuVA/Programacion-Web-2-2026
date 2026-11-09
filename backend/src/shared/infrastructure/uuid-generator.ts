import { randomUUID } from "node:crypto";
import type { IdGenerator } from "../application/ports.js";
import {
  addressId,
  auditId,
  carritoId,
  checkoutId,
  compradorId,
  eventId,
  inventarioId,
  movimientoInventarioId,
  orderId,
  orderItemId,
  orderStatusHistoryId,
  paymentId,
  productImageId,
  productoId,
  reservationId,
  sellerId,
  sessionId,
  shipmentEventId,
  shipmentId,
  shipmentItemId,
  deliveryEvidenceId,
  logisticsOperationId,
  logisticsOperatorId,
  usuarioId,
  warehouseId
} from "../domain/ids.js";

export class UuidGenerator implements IdGenerator {
  usuarioId() {
    return usuarioId(randomUUID());
  }

  compradorId() {
    return compradorId(randomUUID());
  }

  carritoId() {
    return carritoId(randomUUID());
  }

  auditId() {
    return auditId(randomUUID());
  }

  eventId() {
    return eventId(randomUUID());
  }

  sessionId() {
    return sessionId(randomUUID());
  }

  sellerId() {
    return sellerId(randomUUID());
  }

  warehouseId() {
    return warehouseId(randomUUID());
  }

  addressId() {
    return addressId(randomUUID());
  }

  checkoutId() {
    return checkoutId(randomUUID());
  }

  orderId() {
    return orderId(randomUUID());
  }

  orderItemId() {
    return orderItemId(randomUUID());
  }

  paymentId() {
    return paymentId(randomUUID());
  }

  reservationId() {
    return reservationId(randomUUID());
  }

  productoId() {
    return productoId(randomUUID());
  }

  productImageId() {
    return productImageId(randomUUID());
  }

  inventarioId() {
    return inventarioId(randomUUID());
  }

  movimientoInventarioId() {
    return movimientoInventarioId(randomUUID());
  }

  logisticsOperatorId() {
    return logisticsOperatorId(randomUUID());
  }

  shipmentId() {
    return shipmentId(randomUUID());
  }

  shipmentItemId() {
    return shipmentItemId(randomUUID());
  }

  shipmentEventId() {
    return shipmentEventId(randomUUID());
  }

  deliveryEvidenceId() {
    return deliveryEvidenceId(randomUUID());
  }

  orderStatusHistoryId() {
    return orderStatusHistoryId(randomUUID());
  }

  logisticsOperationId() {
    return logisticsOperationId(randomUUID());
  }
}
