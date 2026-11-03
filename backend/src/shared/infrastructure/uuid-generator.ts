import { randomUUID } from "node:crypto";
import type { IdGenerator } from "../application/ports.js";
import {
  addressId,
  auditId,
  carritoId,
  checkoutId,
  compradorId,
  eventId,
  orderId,
  orderItemId,
  paymentId,
  reservationId,
  sellerId,
  sessionId,
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
}
