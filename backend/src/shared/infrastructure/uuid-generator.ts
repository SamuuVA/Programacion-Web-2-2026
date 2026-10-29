import { randomUUID } from "node:crypto";
import type { IdGenerator } from "../application/ports.js";
import {
  auditId,
  carritoId,
  compradorId,
  eventId,
  usuarioId
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
}
