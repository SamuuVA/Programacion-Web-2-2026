import type { BadgeTone } from "@/components/ui/badge";
import type { EstadoUsuario } from "@/features/auth/types";
import type {
  AccionEstadoUsuario,
  EstadoSolicitudVendedor
} from "./types";

export const ESTADO_SOLICITUD_LABEL: Readonly<
  Record<EstadoSolicitudVendedor, string>
> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada"
};

export function estadoSolicitudTone(
  estado: EstadoSolicitudVendedor
): BadgeTone {
  switch (estado) {
    case "APROBADA":
      return "success";
    case "RECHAZADA":
      return "danger";
    default:
      return "warning";
  }
}

export const ACCION_ESTADO_LABEL: Readonly<
  Record<AccionEstadoUsuario, string>
> = {
  ACTIVAR: "Activar",
  DESACTIVAR: "Desactivar",
  BLOQUEAR: "Bloquear",
  DESBLOQUEAR: "Desbloquear"
};

/**
 * Acciones que la interfaz ofrece para cada estado. Es solo una ayuda visual:
 * la tabla de transiciones y la autorización real viven en el backend.
 */
export function accionesDisponibles(
  estado: EstadoUsuario
): readonly AccionEstadoUsuario[] {
  switch (estado) {
    case "ACTIVO":
      return ["DESACTIVAR", "BLOQUEAR"];
    case "INACTIVO":
      return ["ACTIVAR", "BLOQUEAR"];
    case "BLOQUEADO":
      return ["DESBLOQUEAR"];
    default:
      return [];
  }
}

export function motivoObligatorio(accion: AccionEstadoUsuario): boolean {
  return accion === "DESACTIVAR" || accion === "BLOQUEAR";
}
