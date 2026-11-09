import type {
  CategoriaProducto,
  ImagenProducto,
  PrecioProducto,
  TipoEntrega
} from "../domain/producto.js";

export const ORDENES_CATALOGO = [
  "recientes",
  "precio_asc",
  "precio_desc",
  "nombre_asc"
] as const;

export type OrdenCatalogo = (typeof ORDENES_CATALOGO)[number];

export const PAGE_SIZE_DEFAULT = 12;
export const PAGE_SIZE_MAX = 48;
export const SEARCH_MAX_LENGTH = 100;

export interface CatalogFilters {
  readonly search?: string;
  readonly categoria?: CategoriaProducto;
  readonly page: number;
  readonly pageSize: number;
  readonly orden: OrdenCatalogo;
}

export interface VendedorResumen {
  readonly id: string;
  readonly nombreComercial: string;
}

export interface ProductSummary {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly categoria: CategoriaProducto;
  readonly tipoEntrega: TipoEntrega;
  readonly precio: PrecioProducto;
  readonly imagenPrincipal: ImagenProducto | null;
  /**
   * Unidades disponibles en bodegas activas. `null` para entrega digital,
   * donde el concepto de stock físico no aplica.
   */
  readonly disponible: number | null;
  readonly vendedor: VendedorResumen;
  readonly creadoEn: string;
}

export interface ProductDetail extends ProductSummary {
  readonly sku: string;
  readonly imagenes: readonly ImagenProducto[];
  readonly actualizadoEn: string;
}

export interface CatalogPage {
  readonly items: readonly ProductSummary[];
  readonly total: number;
}

/**
 * Puerto de lectura del catálogo público. Solo devuelve productos PUBLICADOS
 * de vendedores ACTIVOS; el alcance administrativo se implementará en otro
 * puerto cuando exista su caso de uso autenticado.
 */
export interface CatalogQueryRepository {
  searchPublic(filters: CatalogFilters): Promise<CatalogPage>;
  findPublicById(productoId: string): Promise<ProductDetail | null>;
  close(): Promise<void>;
}
