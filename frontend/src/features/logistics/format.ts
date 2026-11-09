import type { BadgeTone } from "@/components/ui/badge";
import type { EstadoEnvio, EstadoOperadorLogistico, ResultadoEntrega } from "./types";

export const ESTADO_ENVIO_LABEL: Readonly<Record<EstadoEnvio, string>> = {
  PREPARACION: "En preparación",
  EMPACADO: "Empacado",
  DESPACHADO: "Despachado",
  EN_TRANSITO: "En tránsito",
  ENTREGADO: "Entregado",
  FALLIDO: "Fallo de entrega",
  DEVUELTO: "Devuelto"
};

export const ESTADO_OPERADOR_LABEL: Readonly<
  Record<EstadoOperadorLogistico, string>
> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo"
};

export const RESULTADO_ENTREGA_LABEL: Readonly<Record<ResultadoEntrega, string>> = {
  ENTREGADO: "Entregado",
  FALLIDO: "Fallo de entrega"
};

export function estadoEnvioTone(estado: EstadoEnvio): BadgeTone {
  switch (estado) {
    case "ENTREGADO":
      return "success";
    case "DESPACHADO":
    case "EN_TRANSITO":
    case "PREPARACION":
    case "EMPACADO":
      return "warning";
    case "FALLIDO":
    case "DEVUELTO":
      return "danger";
    default:
      return "neutral";
  }
}

export function estadoOperadorTone(estado: EstadoOperadorLogistico): BadgeTone {
  return estado === "ACTIVO" ? "success" : "danger";
}

export { formatFechaHora, formatMoney } from "@/features/orders/format";
