import type { Clock, IdGenerator } from "../../src/shared/application/ports.js";
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
} from "../../src/shared/domain/ids.js";
import { Instant } from "../../src/shared/domain/value-objects.js";

export class FixedClock implements Clock {
  constructor(private readonly value = "2026-10-28T12:00:00.000Z") {}

  now(): Instant {
    return Instant.fromISOString(this.value);
  }
}

export class SequentialIds implements IdGenerator {
  private user = 0;
  private buyer = 0;
  private cart = 0;
  private audit = 0;
  private event = 0;
  private sequence = 0;

  usuarioId() {
    this.user += 1;
    return usuarioId(`00000000-0000-4000-8000-${String(this.user).padStart(12, "0")}`);
  }

  compradorId() {
    this.buyer += 1;
    return compradorId(`00000000-0000-4000-8001-${String(this.buyer).padStart(12, "0")}`);
  }

  carritoId() {
    this.cart += 1;
    return carritoId(`00000000-0000-4000-8002-${String(this.cart).padStart(12, "0")}`);
  }

  auditId() {
    this.audit += 1;
    return auditId(`00000000-0000-4000-8003-${String(this.audit).padStart(12, "0")}`);
  }

  eventId() {
    this.event += 1;
    return eventId(`00000000-0000-4000-8004-${String(this.event).padStart(12, "0")}`);
  }

  sessionId() {
    return sessionId(`00000000-0000-4000-8005-${String(++this.sequence).padStart(12, "0")}`);
  }

  sellerId() {
    return sellerId(`00000000-0000-4000-8006-${String(++this.sequence).padStart(12, "0")}`);
  }

  warehouseId() {
    return warehouseId(`00000000-0000-4000-8007-${String(++this.sequence).padStart(12, "0")}`);
  }

  addressId() {
    return addressId(`00000000-0000-4000-8008-${String(++this.sequence).padStart(12, "0")}`);
  }

  checkoutId() {
    return checkoutId(`00000000-0000-4000-8009-${String(++this.sequence).padStart(12, "0")}`);
  }

  orderId() {
    return orderId(`00000000-0000-4000-8010-${String(++this.sequence).padStart(12, "0")}`);
  }

  orderItemId() {
    return orderItemId(`00000000-0000-4000-8011-${String(++this.sequence).padStart(12, "0")}`);
  }

  paymentId() {
    return paymentId(`00000000-0000-4000-8012-${String(++this.sequence).padStart(12, "0")}`);
  }

  reservationId() {
    return reservationId(`00000000-0000-4000-8013-${String(++this.sequence).padStart(12, "0")}`);
  }

  productoId() {
    return productoId(`00000000-0000-4000-8014-${String(++this.sequence).padStart(12, "0")}`);
  }

  productImageId() {
    return productImageId(`00000000-0000-4000-8015-${String(++this.sequence).padStart(12, "0")}`);
  }

  inventarioId() {
    return inventarioId(`00000000-0000-4000-8016-${String(++this.sequence).padStart(12, "0")}`);
  }

  movimientoInventarioId() {
    return movimientoInventarioId(
      `00000000-0000-4000-8017-${String(++this.sequence).padStart(12, "0")}`
    );
  }

  logisticsOperatorId() {
    return logisticsOperatorId(
      `00000000-0000-4000-8018-${String(++this.sequence).padStart(12, "0")}`
    );
  }

  shipmentId() {
    return shipmentId(
      `00000000-0000-4000-8019-${String(++this.sequence).padStart(12, "0")}`
    );
  }

  shipmentItemId() {
    return shipmentItemId(
      `00000000-0000-4000-8020-${String(++this.sequence).padStart(12, "0")}`
    );
  }

  shipmentEventId() {
    return shipmentEventId(
      `00000000-0000-4000-8021-${String(++this.sequence).padStart(12, "0")}`
    );
  }

  deliveryEvidenceId() {
    return deliveryEvidenceId(
      `00000000-0000-4000-8022-${String(++this.sequence).padStart(12, "0")}`
    );
  }

  orderStatusHistoryId() {
    return orderStatusHistoryId(
      `00000000-0000-4000-8023-${String(++this.sequence).padStart(12, "0")}`
    );
  }

  logisticsOperationId() {
    return logisticsOperationId(
      `00000000-0000-4000-8024-${String(++this.sequence).padStart(12, "0")}`
    );
  }
}
