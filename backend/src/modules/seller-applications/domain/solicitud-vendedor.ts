import { ValidationError } from "../../../shared/domain/errors.js";

/**
 * Estados del agregado SolicitudVendedor.
 *
 * Es un concepto distinto de `EstadoUsuario` (acceso) y de `EstadoVendedor`
 * (operación comercial). No se reutilizan estados de acceso para la solicitud.
 */
export const ESTADOS_SOLICITUD_VENDEDOR = [
  "PENDIENTE",
  "APROBADA",
  "RECHAZADA"
] as const;

export type EstadoSolicitudVendedor =
  (typeof ESTADOS_SOLICITUD_VENDEDOR)[number];

export const ACCIONES_SOLICITUD_VENDEDOR = ["APROBAR", "RECHAZAR"] as const;
export type AccionSolicitudVendedor =
  (typeof ACCIONES_SOLICITUD_VENDEDOR)[number];

export interface DatosSolicitudVendedor {
  readonly nombreComercial: string;
  readonly nombreBodega: string;
  readonly ubicacionBodega: string;
}

const NOMBRE_COMERCIAL_MAX = 120;
const NOMBRE_BODEGA_MAX = 120;
const UBICACION_BODEGA_MAX = 200;
const MOTIVO_RECHAZO_MIN = 3;
const MOTIVO_RECHAZO_MAX = 500;

export function validarDatosSolicitud(input: {
  nombreComercial: string;
  nombreBodega: string;
  ubicacionBodega: string;
}): DatosSolicitudVendedor {
  return {
    nombreComercial: textoRequerido(
      input.nombreComercial,
      "El nombre comercial",
      NOMBRE_COMERCIAL_MAX
    ),
    nombreBodega: textoRequerido(
      input.nombreBodega,
      "El nombre de la bodega",
      NOMBRE_BODEGA_MAX
    ),
    ubicacionBodega: textoRequerido(
      input.ubicacionBodega,
      "La ubicación de la bodega",
      UBICACION_BODEGA_MAX
    )
  };
}

export function validarMotivoRechazo(value: string): string {
  if (typeof value !== "string") {
    throw new ValidationError("El motivo de rechazo es obligatorio.");
  }
  const motivo = value.trim().replace(/\s+/g, " ");
  if (motivo.length < MOTIVO_RECHAZO_MIN) {
    throw new ValidationError(
      `El motivo de rechazo debe tener al menos ${MOTIVO_RECHAZO_MIN} caracteres.`
    );
  }
  if (motivo.length > MOTIVO_RECHAZO_MAX) {
    throw new ValidationError(
      `El motivo de rechazo no puede superar ${MOTIVO_RECHAZO_MAX} caracteres.`
    );
  }
  return motivo;
}

/**
 * La aprobación solo es válida desde PENDIENTE. Un reintento sobre una
 * solicitud ya aprobada se resuelve en el adaptador como éxito idempotente.
 */
export function puedeAprobarse(estado: EstadoSolicitudVendedor): boolean {
  return estado === "PENDIENTE";
}

export function puedeRechazarse(estado: EstadoSolicitudVendedor): boolean {
  return estado === "PENDIENTE";
}

function textoRequerido(
  value: string,
  etiqueta: string,
  maxLength: number
): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${etiqueta} es obligatorio.`);
  }
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    throw new ValidationError(`${etiqueta} no puede estar vacío.`);
  }
  if (normalized.length > maxLength) {
    throw new ValidationError(
      `${etiqueta} no puede superar ${maxLength} caracteres.`
    );
  }
  return normalized;
}
