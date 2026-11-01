import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import {
  CATEGORIAS_PRODUCTO,
  ETIQUETAS_CATEGORIA
} from "../../domain/producto.js";
import {
  ORDENES_CATALOGO,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  SEARCH_MAX_LENGTH,
  type CatalogFilters
} from "../../application/ports.js";
import type { QueryCatalog } from "../../application/query-catalog.js";

const listQuerySchema = z
  .object({
    search: z.string().max(SEARCH_MAX_LENGTH).optional(),
    categoria: z.enum(CATEGORIAS_PRODUCTO).optional(),
    orden: z.enum(ORDENES_CATALOGO).default("recientes"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(PAGE_SIZE_MAX)
      .default(PAGE_SIZE_DEFAULT)
  })
  .strict();

const productParamsSchema = z
  .object({
    productId: z.string().min(1)
  })
  .strict();

export function registerCatalogRoutes(
  app: FastifyInstance,
  useCase: QueryCatalog
): void {
  app.get("/api/v1/products", async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const filters: CatalogFilters = {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      orden: parsed.data.orden,
      ...(parsed.data.search !== undefined
        ? { search: parsed.data.search }
        : {}),
      ...(parsed.data.categoria !== undefined
        ? { categoria: parsed.data.categoria }
        : {})
    };
    const result = await useCase.list(filters);
    return reply.code(200).send({ data: result });
  });

  app.get("/api/v1/products/:productId", async (request, reply) => {
    const parsed = productParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const product = await useCase.detail(parsed.data.productId);
    return reply.code(200).send({ data: product });
  });

  app.get("/api/v1/categories", async (_request, reply) => {
    return reply.code(200).send({
      data: CATEGORIAS_PRODUCTO.map((codigo) => ({
        codigo,
        nombre: ETIQUETAS_CATEGORIA[codigo]
      }))
    });
  });
}

function validationError(error: z.ZodError): ValidationError {
  return new ValidationError("La solicitud no es válida.", {
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }))
  });
}
