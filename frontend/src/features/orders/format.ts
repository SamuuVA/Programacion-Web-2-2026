import type { EstadoPago, EstadoPedido, ResultadoPagoSimulado } from "./types";

export const ESTADO_PEDIDO_LABEL: Readonly<Record<EstadoPedido, string>> = {
  PENDIENTE_DE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  EN_PREPARACION: "En preparación",
  DESPACHADO: "Despachado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  CERRADO: "Cerrado"
};

export const ESTADO_PAGO_LABEL: Readonly<Record<EstadoPago, string>> = {
  PENDIENTE: "Pago pendiente",
  AUTORIZADO: "Pago autorizado",
  CAPTURADO: "Pago capturado",
  RECHAZADO: "Pago rechazado",
  CANCELADO: "Pago cancelado",
  REEMBOLSO_PARCIAL: "Reembolso parcial",
  REEMBOLSADO: "Reembolsado"
};

export const RESULTADO_PAGO_LABEL: Readonly<Record<ResultadoPagoSimulado, string>> = {
  CONFIRMADO: "Pago confirmado",
  RECHAZADO: "Pago rechazado",
  DESCONOCIDO: "Resultado desconocido"
};

export function estadoPedidoTone(
  estado: EstadoPedido
): "success" | "warning" | "neutral" | "danger" {
  switch (estado) {
    case "EN_PREPARACION":
    case "PAGADO":
    case "DESPACHADO":
    case "ENTREGADO":
    case "CERRADO":
      return "success";
    case "PENDIENTE_DE_PAGO":
      return "warning";
    case "CANCELADO":
      return "danger";
    default:
      return "neutral";
  }
}

export function estadoPagoTone(
  estado: EstadoPago
): "success" | "warning" | "neutral" | "danger" {
  switch (estado) {
    case "CAPTURADO":
      return "success";
    case "PENDIENTE":
    case "AUTORIZADO":
      return "warning";
    case "RECHAZADO":
    case "CANCELADO":
      return "danger";
    default:
      return "neutral";
  }
}

export function formatMoney(centavos: number, moneda: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(centavos / 100);
}

export function formatFechaHora(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
