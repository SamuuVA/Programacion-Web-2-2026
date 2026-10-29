type Brand<T, B extends string> = T & { readonly __brand: B };

export type UsuarioId = Brand<string, "UsuarioId">;
export type CompradorId = Brand<string, "CompradorId">;
export type CarritoId = Brand<string, "CarritoId">;
export type AuditId = Brand<string, "AuditId">;
export type EventId = Brand<string, "EventId">;

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

function nonEmptyId(value: string, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} no puede estar vacío.`);
  }
  return value;
}
