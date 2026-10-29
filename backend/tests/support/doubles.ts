import type { Clock, IdGenerator } from "../../src/shared/application/ports.js";
import {
  auditId,
  carritoId,
  compradorId,
  eventId,
  usuarioId
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
}
