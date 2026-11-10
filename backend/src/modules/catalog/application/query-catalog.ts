import {
  ResourceNotFoundError,
  ValidationError
} from "../../../shared/domain/errors.js";
import {
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  SEARCH_MAX_LENGTH,
  type CatalogFilters,
  type CatalogPage,
  type CatalogQueryRepository,
  type ProductDetail,
  type ProductSummary
} from "./ports.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CatalogListResult {
  readonly items: readonly ProductSummary[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

/**
 * PI-07 QueryCatalog, alcance público.
 *
 * No muta estado. La validación de filtros pertenece al contrato HTTP y se
 * repite aquí para que el caso de uso sea seguro ante otros consumidores.
 */
export class QueryCatalog {
  constructor(private readonly repository: CatalogQueryRepository) {}

  async list(input: CatalogFilters): Promise<CatalogListResult> {
    const page = input.page;
    const pageSize = input.pageSize;
    if (!Number.isInteger(page) || page < 1) {
      throw new ValidationError(
        "La página debe ser un entero mayor o igual a 1."
      );
    }
    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > PAGE_SIZE_MAX
    ) {
      throw new ValidationError(
        `El tamaño de página debe estar entre 1 y ${PAGE_SIZE_MAX}.`
      );
    }

    const search = input.search?.trim();
    if (search !== undefined && search.length > SEARCH_MAX_LENGTH) {
      throw new ValidationError(
        `La búsqueda no puede superar ${SEARCH_MAX_LENGTH} caracteres.`
      );
    }

    const filters: CatalogFilters = {
      page,
      pageSize,
      orden: input.orden,
      ...(search && search.length > 0 ? { search } : {}),
      ...(input.categoria !== undefined ? { categoria: input.categoria } : {})
    };

    const result: CatalogPage = await this.repository.searchPublic(filters);
    return {
      items: result.items,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / pageSize))
      }
    };
  }

  async detail(productoId: string): Promise<ProductDetail> {
    if (!UUID_PATTERN.test(productoId)) {
      throw new ValidationError("El identificador del producto no es válido.");
    }
    const product = await this.repository.findPublicById(productoId);
    if (product === null) {
      throw new ResourceNotFoundError(
        "El producto no existe o no está disponible en el catálogo."
      );
    }
    return product;
  }
}

export { PAGE_SIZE_DEFAULT };
