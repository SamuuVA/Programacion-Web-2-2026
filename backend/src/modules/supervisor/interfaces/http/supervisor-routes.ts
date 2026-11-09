import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import { isUuid } from "../../../../shared/domain/value-objects.js";
import { CATEGORIAS_PRODUCTO } from "../../../catalog/domain/producto.js";
import { ESTADOS_ENVIO } from "../../../logistics/domain/envio.js";
import type { AuthenticatedUser } from "../../../identity/application/ports.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";
import {
  ESTADOS_PEDIDO_SUPERVISOR,
  ESTADOS_PRODUCTO_SUPERVISOR,
  ESTADOS_VENDEDOR_SUPERVISOR,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX
} from "../../application/ports.js";
import type {
  GetSupervisorDashboard,
  GetSupervisorOrder,
  GetSupervisorProduct,
  ListSupervisorInventory,
  ListSupervisorOrders,
  ListSupervisorProducts,
  ListSupervisorSellers,
  ListSupervisorShipments,
  ListSupervisorWarehouses
} from "../../application/use-cases.js";

const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT)
};

const orderParamsSchema = z
  .object({
    orderId: z.string().refine(isUuid, "El orderId debe ser un UUID.")
  })
  .strict();

const productParamsSchema = z
  .object({
    productId: z.string().refine(isUuid, "El productId debe ser un UUID.")
  })
  .strict();

const listOrdersSchema = z
  .object({
    estado: z.enum(ESTADOS_PEDIDO_SUPERVISOR).optional(),
    ...pageFields
  })
  .strict();

const listProductsSchema = z
  .object({
    estado: z.enum(ESTADOS_PRODUCTO_SUPERVISOR).optional(),
    categoria: z.enum(CATEGORIAS_PRODUCTO).optional(),
    vendedorId: z.string().refine(isUuid, "El vendedorId debe ser un UUID.").optional(),
    ...pageFields
  })
  .strict();

const listInventorySchema = z
  .object({
    bodegaId: z.string().refine(isUuid, "El bodegaId debe ser un UUID.").optional(),
    productoId: z.string().refine(isUuid, "El productoId debe ser un UUID.").optional(),
    ...pageFields
  })
  .strict();

const listShipmentsSchema = z
  .object({
    estado: z.enum(ESTADOS_ENVIO).optional(),
    pedidoId: z.string().refine(isUuid, "El pedidoId debe ser un UUID.").optional(),
    ...pageFields
  })
  .strict();

const listSellersSchema = z
  .object({
    estado: z.enum(ESTADOS_VENDEDOR_SUPERVISOR).optional(),
    ...pageFields
  })
  .strict();

export interface SupervisorRoutesDependencies {
  readonly authenticator: SessionAuthenticator;
  readonly getDashboard: GetSupervisorDashboard;
  readonly listOrders: ListSupervisorOrders;
  readonly getOrder: GetSupervisorOrder;
  readonly listProducts: ListSupervisorProducts;
  readonly getProduct: GetSupervisorProduct;
  readonly listWarehouses: ListSupervisorWarehouses;
  readonly listInventory: ListSupervisorInventory;
  readonly listShipments: ListSupervisorShipments;
  readonly listSellers: ListSupervisorSellers;
}

/**
 * Rutas de solo lectura del Supervisor.
 *
 * Además de registrar únicamente `GET`, se instala una guarda de método sobre
 * todo el prefijo `/api/v1/supervisor`: cualquier `POST`, `PATCH`, `PUT` o
 * `DELETE` se rechaza con `405` aunque la ruta no exista. Así la restricción
 * `SUP-01` no depende de que el cliente respete la navegación.
 */
export function registerSupervisorRoutes(
  app: FastifyInstance,
  dependencies: SupervisorRoutesDependencies
): void {
  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] ?? "/";
    if (path !== "/api/v1/supervisor" && !path.startsWith("/api/v1/supervisor/")) {
      return;
    }
    if (
      request.method === "GET" ||
      request.method === "HEAD" ||
      request.method === "OPTIONS"
    ) {
      return;
    }
    reply.header("allow", "GET, HEAD");
    return reply.code(405).send({
      error: {
        codigo: "METODO_NO_PERMITIDO",
        mensaje:
          "El espacio del supervisor es de solo lectura; el método HTTP no está permitido.",
        correlationId: request.id
      }
    });
  });

  app.get("/api/v1/supervisor/dashboard", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const dashboard = await dependencies.getDashboard.execute(actor);
    return reply.code(200).send({ data: dashboard });
  });

  app.get("/api/v1/supervisor/orders", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const query = parse(listOrdersSchema, request.query ?? {});
    const orders = await dependencies.listOrders.execute(actor, {
      estado: query.estado ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: orders });
  });

  app.get("/api/v1/supervisor/orders/:orderId", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const params = parse(orderParamsSchema, request.params);
    const order = await dependencies.getOrder.execute(actor, params.orderId);
    return reply.code(200).send({ data: order });
  });

  app.get("/api/v1/supervisor/products", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const query = parse(listProductsSchema, request.query ?? {});
    const products = await dependencies.listProducts.execute(actor, {
      estado: query.estado ?? null,
      categoria: query.categoria ?? null,
      vendedorId: query.vendedorId ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: products });
  });

  app.get("/api/v1/supervisor/products/:productId", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const params = parse(productParamsSchema, request.params);
    const product = await dependencies.getProduct.execute(actor, params.productId);
    return reply.code(200).send({ data: product });
  });

  app.get("/api/v1/supervisor/warehouses", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const warehouses = await dependencies.listWarehouses.execute(actor);
    return reply.code(200).send({ data: warehouses });
  });

  app.get("/api/v1/supervisor/inventory", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const query = parse(listInventorySchema, request.query ?? {});
    const inventory = await dependencies.listInventory.execute(actor, {
      bodegaId: query.bodegaId ?? null,
      productoId: query.productoId ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: inventory });
  });

  app.get("/api/v1/supervisor/shipments", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const query = parse(listShipmentsSchema, request.query ?? {});
    const shipments = await dependencies.listShipments.execute(actor, {
      estado: query.estado ?? null,
      pedidoId: query.pedidoId ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: shipments });
  });

  app.get("/api/v1/supervisor/sellers", async (request, reply) => {
    const actor = await supervisorOf(request, dependencies.authenticator);
    const query = parse(listSellersSchema, request.query ?? {});
    const sellers = await dependencies.listSellers.execute(actor, {
      estado: query.estado ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: sellers });
  });
}

async function supervisorOf(
  request: FastifyRequest,
  authenticator: SessionAuthenticator
): Promise<AuthenticatedUser> {
  const user = await authenticator.requireUser(request);
  authenticator.requireSupervisor(user);
  return user;
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError("La solicitud no es válida.", {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }
  return parsed.data;
}
