import type {
  CategoriaProducto,
  OrdenCatalogo,
  PrecioProducto
} from "./types";

export const CATEGORIA_LABEL: Readonly<Record<CategoriaProducto, string>> = {
  ELECTRONICA: "Electrónica",
  ROPA: "Ropa",
  HOGAR: "Hogar",
  DIGITAL: "Digital"
};

export const CATEGORIA_DESCRIPCION: Readonly<Record<CategoriaProducto, string>> =
  {
    ELECTRONICA: "Tecnología para el día a día",
    ROPA: "Prendas y accesorios con carácter",
    HOGAR: "Objetos que hacen hogar",
    DIGITAL: "Cursos, guías y descargas"
  };

export const ORDEN_LABEL: Readonly<Record<OrdenCatalogo, string>> = {
  recientes: "Más recientes",
  precio_asc: "Precio: menor a mayor",
  precio_desc: "Precio: mayor a menor",
  nombre_asc: "Nombre: A–Z"
};

export function formatPrecio(precio: PrecioProducto): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: precio.moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(precio.montoCentavos / 100);
}

export function formatFecha(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(date);
}

export function disponibilidadTexto(
  disponible: number | null,
  tipoEntrega: "FISICA" | "DIGITAL"
): { label: string; tone: "success" | "warning" | "neutral" } {
  if (tipoEntrega === "DIGITAL") {
    return { label: "Entrega digital", tone: "neutral" };
  }
  if (disponible === null || disponible === 0) {
    return { label: "Sin unidades disponibles", tone: "warning" };
  }
  return {
    label: `${disponible} ${disponible === 1 ? "unidad disponible" : "unidades disponibles"}`,
    tone: "success"
  };
}
