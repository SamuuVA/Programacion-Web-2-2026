import { BusinessRuleError } from "../../../shared/domain/errors.js";

/**
 * Dominio logístico: estados del envío y precondiciones de las transiciones
 * definidas en el modelo (§13.1–§13.2, §22.5). No contiene HTTP ni SQL.
 */

export const ESTADOS_ENVIO = [
  "PREPARACION",
  "EMPACADO",
  "DESPACHADO",
  "EN_TRANSITO",
  "ENTREGADO",
  "FALLIDO",
  "DEVUELTO"
] as const;

export type EstadoEnvio = (typeof ESTADOS_ENVIO)[number];

export const RESULTADOS_ENTREGA = ["ENTREGADO", "FALLIDO"] as const;
export type ResultadoEntrega = (typeof RESULTADOS_ENTREGA)[number];

/** Estados del pedido en los que la operación logística puede preparar. */
const ESTADOS_PEDIDO_PREPARABLES = new Set(["PAGADO", "EN_PREPARACION"]);
const ESTADOS_PEDIDO_DESPACHABLES = new Set(["PAGADO", "EN_PREPARACION"]);
const ESTADOS_ENVIO_PREPARABLES = new Set<EstadoEnvio>([
  "PREPARACION",
  "EMPACADO"
]);
const ESTADOS_ENVIO_ENTREGABLES = new Set<EstadoEnvio>([
  "DESPACHADO",
  "EN_TRANSITO"
]);

export function assertPedidoPreparable(estado: string): void {
  if (!ESTADOS_PEDIDO_PREPARABLES.has(estado)) {
    throw new BusinessRuleError(
      "Solo un pedido pagado puede prepararse; el pedido está en un estado incompatible.",
      { motivo: "TRANSICION_INVALIDA", estadoPedido: estado }
    );
  }
}

export function assertPedidoDespachable(estado: string): void {
  if (!ESTADOS_PEDIDO_DESPACHABLES.has(estado)) {
    throw new BusinessRuleError(
      "Solo un pedido pagado y en preparación puede despacharse.",
      { motivo: "TRANSICION_INVALIDA", estadoPedido: estado }
    );
  }
}

export function assertEnvioPreparable(estado: EstadoEnvio): void {
  if (!ESTADOS_ENVIO_PREPARABLES.has(estado)) {
    throw new BusinessRuleError(
      "El envío no admite preparación en su estado actual.",
      { motivo: "TRANSICION_INVALIDA", estadoEnvio: estado }
    );
  }
}

export function assertEnvioEntregable(estado: EstadoEnvio): void {
  if (!ESTADOS_ENVIO_ENTREGABLES.has(estado)) {
    throw new BusinessRuleError(
      "Solo un envío despachado o en tránsito puede confirmarse como entregado o fallido.",
      { motivo: "TRANSICION_INVALIDA", estadoEnvio: estado }
    );
  }
}

export interface EvidenciaEntrega {
  readonly tipo: string;
  readonly referencia: string;
  readonly nota: string | null;
}

/**
 * La entrega no se marca sin prueba. Para un fallo se exige el motivo, que se
 * conserva como referencia de la evidencia (PI-18).
 */
export function normalizarEvidencia(
  resultado: ResultadoEntrega,
  input: {
    readonly tipo?: string | null | undefined;
    readonly referencia?: string | null | undefined;
    readonly nota?: string | null | undefined;
    readonly motivo?: string | null | undefined;
  }
): EvidenciaEntrega {
  if (resultado === "ENTREGADO") {
    const tipo = textoObligatorio(input.tipo, "El tipo de evidencia");
    const referencia = textoObligatorio(
      input.referencia,
      "La referencia de la evidencia"
    );
    return { tipo, referencia, nota: textoOpcional(input.nota) };
  }

  const motivo = textoObligatorio(
    input.motivo ?? input.referencia,
    "El motivo del fallo de entrega"
  );
  return {
    tipo: textoOpcional(input.tipo) ?? "FALLO_ENTREGA",
    referencia: motivo,
    nota: textoOpcional(input.nota)
  };
}

export function textoOpcional(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function textoObligatorio(
  value: string | null | undefined,
  campo: string,
  max = 200
): string {
  const trimmed = textoOpcional(value);
  if (trimmed === null) {
    throw new BusinessRuleError(`${campo} es obligatorio.`, {
      motivo: "EVIDENCIA_REQUERIDA"
    });
  }
  if (trimmed.length > max) {
    throw new BusinessRuleError(`${campo} excede la longitud permitida.`, {
      motivo: "VALIDACION_INVALIDA",
      max
    });
  }
  return trimmed;
}
