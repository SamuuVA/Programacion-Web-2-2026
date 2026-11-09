import type { BadgeTone } from "@/components/ui/badge";
import type {
  EstadoBodega,
  EstadoComprador,
  EstadoOperador,
  TipoBodega
} from "./types";

/**
 * Etiquetas del espacio administrativo.
 *
 * Reutiliza los mapas de vendedor, logística, pedidos y catálogo para no
 * duplicar vocabulario ni introducir estados nuevos.
 */

export {
  ESTADO_PRODUCTO_LABEL,
  ESTADO_VENDEDOR_LABEL,
  estadoProductoTone,
  estadoVendedorTone
} from "@/features/seller/format";

export {
  ESTADO_ENVIO_LABEL,
  ESTADO_OPERADOR_LABEL,
  estadoEnvioTone,
  estadoOperadorTone
} from "@/features/logistics/format";

export {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone,
  formatFechaHora,
  formatMoney
} from "@/features/orders/format";

export { CATEGORIA_LABEL } from "@/features/catalog/format";

export const ROL_LABEL: Readonly<Record<string, string>> = {
  COMPRADOR: "Comprador",
  VENDEDOR: "Vendedor",
  OPERADOR_LOGISTICO: "Operador logístico",
  ADMINISTRADOR: "Administrador",
  SUPERVISOR: "Supervisor"
};

export const ESTADO_USUARIO_LABEL: Readonly<Record<string, string>> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  BLOQUEADO: "Bloqueado"
};

export function estadoUsuarioTone(estado: string): BadgeTone {
  switch (estado) {
    case "ACTIVO":
      return "success";
    case "INACTIVO":
      return "warning";
    case "BLOQUEADO":
      return "danger";
    default:
      return "neutral";
  }
}

export const ESTADO_COMPRADOR_LABEL: Readonly<Record<EstadoComprador, string>> = {
  HABILITADO: "Habilitado",
  RESTRINGIDO: "Restringido"
};

export function estadoCompradorTone(estado: EstadoComprador): BadgeTone {
  return estado === "HABILITADO" ? "success" : "danger";
}

export const ESTADO_BODEGA_LABEL: Readonly<Record<EstadoBodega, string>> = {
  ACTIVA: "Activa",
  INACTIVA: "Inactiva"
};

export const TIPO_BODEGA_LABEL: Readonly<Record<TipoBodega, string>> = {
  MARKETPLACE: "Marketplace",
  VENDEDOR: "Vendedor"
};

export function estadoBodegaTone(estado: EstadoBodega): BadgeTone {
  return estado === "ACTIVA" ? "success" : "danger";
}

export const ESTADO_RESERVA_LABEL: Readonly<
  Record<"ACTIVA" | "LIBERADA" | "CONSUMIDA", string>
> = {
  ACTIVA: "Activa",
  LIBERADA: "Liberada",
  CONSUMIDA: "Consumida"
};

export function estadoOperadorAdminTone(estado: EstadoOperador): BadgeTone {
  return estado === "ACTIVO" ? "success" : "danger";
}

export const MOVIMIENTO_LABEL: Readonly<Record<string, string>> = {
  INGRESO: "Ingreso",
  RESERVA: "Reserva",
  LIBERACION_RESERVA: "Liberación de reserva",
  SALIDA_VENTA: "Salida por venta",
  AJUSTE_POSITIVO: "Ajuste positivo",
  AJUSTE_NEGATIVO: "Ajuste negativo",
  DEVOLUCION_VENDIBLE: "Devolución vendible",
  DEVOLUCION_NO_VENDIBLE: "Devolución no vendible",
  BAJA_DANIO: "Baja por daño"
};
