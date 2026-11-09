import type { BadgeTone } from "@/components/ui/badge";
import type {
  EstadoProductoVendedor,
  EstadoVendedor
} from "./types";

export const ESTADO_PRODUCTO_LABEL: Readonly<
  Record<EstadoProductoVendedor, string>
> = {
  BORRADOR: "Borrador",
  PUBLICADO: "Publicado",
  SUSPENDIDO: "Suspendido",
  DESCONTINUADO: "Descontinuado"
};

export const ESTADO_VENDEDOR_LABEL: Readonly<Record<EstadoVendedor, string>> = {
  EN_REVISION: "En revisión",
  ACTIVO: "Activo",
  SUSPENDIDO: "Suspendido",
  INACTIVO: "Inactivo"
};

export function estadoProductoTone(
  estado: EstadoProductoVendedor
): BadgeTone {
  switch (estado) {
    case "PUBLICADO":
      return "success";
    case "BORRADOR":
      return "warning";
    case "SUSPENDIDO":
      return "neutral";
    case "DESCONTINUADO":
      return "danger";
  }
}

export function estadoVendedorTone(estado: EstadoVendedor): BadgeTone {
  switch (estado) {
    case "ACTIVO":
      return "success";
    case "EN_REVISION":
      return "warning";
    case "SUSPENDIDO":
    case "INACTIVO":
      return "danger";
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

export function centavosDesdeTexto(value: string): number {
  const normalized = value.trim().replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  return Math.round(amount * 100);
}
