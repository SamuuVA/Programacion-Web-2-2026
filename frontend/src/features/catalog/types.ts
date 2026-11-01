export const CATEGORIAS = [
  "ELECTRONICA",
  "ROPA",
  "HOGAR",
  "DIGITAL"
] as const;

export type CategoriaProducto = (typeof CATEGORIAS)[number];

export type TipoEntrega = "FISICA" | "DIGITAL";

export const ORDENES_CATALOGO = [
  "recientes",
  "precio_asc",
  "precio_desc",
  "nombre_asc"
] as const;

export type OrdenCatalogo = (typeof ORDENES_CATALOGO)[number];

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

export interface VendedorResumen {
  readonly id: string;
  readonly nombreComercial: string;
}

export interface ProductoResumen {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly categoria: CategoriaProducto;
  readonly tipoEntrega: TipoEntrega;
  readonly precio: PrecioProducto;
  readonly imagenPrincipal: ImagenProducto | null;
  readonly disponible: number | null;
  readonly vendedor: VendedorResumen;
  readonly creadoEn: string;
}

export interface ProductoDetalle extends ProductoResumen {
  readonly sku: string;
  readonly imagenes: readonly ImagenProducto[];
  readonly actualizadoEn: string;
}

export interface PaginacionCatalogo {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface ProductosPage {
  readonly items: readonly ProductoResumen[];
  readonly pagination: PaginacionCatalogo;
}

export interface Categoria {
  readonly codigo: CategoriaProducto;
  readonly nombre: string;
}

export interface CatalogQuery {
  readonly search?: string;
  readonly categoria?: CategoriaProducto;
  readonly orden?: OrdenCatalogo;
  readonly page?: number;
  readonly pageSize?: number;
}
