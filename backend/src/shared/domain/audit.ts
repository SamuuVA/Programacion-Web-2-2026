import type { AuditId, EventId } from "./ids.js";
import type { Instant } from "./value-objects.js";

export const RESULTADOS_AUDITORIA = ["EXITO", "RECHAZO", "ERROR"] as const;
export type ResultadoAuditoria = (typeof RESULTADOS_AUDITORIA)[number];

export const GRAVEDADES_AUDITORIA = ["INFORMACION", "ADVERTENCIA", "ERROR", "CRITICO"] as const;
export type GravedadAuditoria = (typeof GRAVEDADES_AUDITORIA)[number];

export interface RegistroAuditoria {
  readonly id: AuditId;
  readonly evento: string;
  readonly recursoTipo: string;
  readonly recursoId: string;
  readonly actorId: string;
  readonly rolActor?: string;
  readonly ocurridoEn: Instant;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly resultado: ResultadoAuditoria;
  readonly gravedad: GravedadAuditoria;
  readonly detalles: Record<string, unknown>;
}

export interface EventoDominio {
  readonly id: EventId;
  readonly tipo: string;
  readonly versionEsquema: 1;
  readonly agregadoTipo: string;
  readonly agregadoId: string;
  readonly ocurridoEn: Instant;
  readonly correlationId: string;
  readonly payload: Record<string, unknown>;
}
