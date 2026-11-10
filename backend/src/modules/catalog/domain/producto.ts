/**
 * Catálogo V1.
 *
 * Decisión aprobada: en V1 no existen variantes comerciales. Cada producto es
 * una combinación vendible independiente con su propio SKU, precio e imágenes.
 */

export const CATEGORIAS_PRODUCTO = [
  "ELECTRONICA",
  "ROPA",
  "HOGAR",
  "DIGITAL"
] as const;

export type CategoriaProducto = (typeof CATEGORIAS_PRODUCTO)[number];

export const ETIQUETAS_CATEGORIA: Readonly<Record<CategoriaProducto, string>> =
  {
    ELECTRONICA: "Electrónica",
    ROPA: "Ropa",
    HOGAR: "Hogar",
    DIGITAL: "Digital"
  };

export const ESTADOS_PRODUCTO = [
  "PUBLICADO",
  "SUSPENDIDO",
  "DESCONTINUADO"
] as const;

export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[number];

export const TIPOS_ENTREGA = ["FISICA", "DIGITAL"] as const;
export type TipoEntrega = (typeof TIPOS_ENTREGA)[number];

export interface ImagenProducto {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly orden: number;
}

export interface PrecioProducto {
  readonly montoCentavos: number;
  readonly moneda: string;
}

export function esCategoriaProducto(value: string): value is CategoriaProducto {
  return (CATEGORIAS_PRODUCTO as readonly string[]).includes(value);
}
