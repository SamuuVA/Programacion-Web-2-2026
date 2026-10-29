import type { AuditId, CarritoId, CompradorId, EventId, UsuarioId } from "../domain/ids.js";
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
}

export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(hash: string, plainPassword: string): Promise<boolean>;
}
