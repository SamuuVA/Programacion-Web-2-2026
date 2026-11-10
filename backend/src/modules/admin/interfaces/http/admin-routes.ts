import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import { isUuid } from "../../../../shared/domain/value-objects.js";
import { CATEGORIAS_PRODUCTO } from "../../../catalog/domain/producto.js";
import type { AuthenticatedUser } from "../../../identity/application/ports.js";
import {
  ACCIONES_ESTADO_USUARIO,
  type UpdateUserAccessStatus
} from "../../../identity/application/update-user-access-status.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";
import {
  ESTADOS_BODEGA_ADMIN,
  ESTADOS_COMPRADOR_ADMIN,
  ESTADOS_PAGO_ADMIN,
  ESTADOS_PEDIDO_ADMIN,
  ESTADOS_PRODUCTO_ADMIN,
  ESTADOS_USUARIO_ADMIN,
  ESTADOS_VENDEDOR_ADMIN,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  ROLES_ADMIN,
  TIPOS_ENTREGA_ADMIN
} from "../../application/ports.js";
import type {
  GetAdminBuyer,
  GetAdminDashboard,
  GetAdminOrder,
  GetAdminProduct,
  GetAdminReports,
  GetAdminSeller,
  GetAdminUser,
  GetAdminWarehouse,
  ListAdminBuyers,
  ListAdminInventory,
  ListAdminMovements,
  ListAdminOrders,
  ListAdminPayments,
  ListAdminProducts,
  ListAdminSellers,
  ListAdminUsers,
  ListAdminWarehouses
} from "../../application/use-cases.js";

/**
 * Rutas de consulta del Administrador.
 *
 * Se registran solo `GET`. La guarda de método permite `POST` únicamente en las
 * dos altas administrativas ya existentes (`/admin/sellers` y
 * `/admin/logistics-operators`); cualquier otra escritura bajo `/api/v1/admin`
 * se rechaza con `405` aunque la ruta no exista.
 */

const PAGE_FIELDS = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT)
};

const SEARCH_FIELD = z.string().trim().min(1).max(120).optional();

const POST_ALLOWLIST = new Set([
  "/api/v1/admin/sellers",
  "/api/v1/admin/logistics-operators"
]);

const UUID_SEGMENT = "[0-9a-fA-F-]{36}";
const SELLER_APPLICATION_ACTION = new RegExp(
  `^/api/v1/admin/seller-applications/${UUID_SEGMENT}/(approve|reject)$`
);
const USER_ACCESS_STATUS = new RegExp(
  `^/api/v1/admin/users/${UUID_SEGMENT}/access-status$`
);

function isAllowedAdminWrite(method: string, path: string): boolean {
  if (method === "POST") {
    return POST_ALLOWLIST.has(path) || SELLER_APPLICATION_ACTION.test(path);
  }
  if (method === "PATCH") {
    return USER_ACCESS_STATUS.test(path);
  }
  return false;
}

function allowedMethodsFor(path: string): string {
  if (POST_ALLOWLIST.has(path) || SELLER_APPLICATION_ACTION.test(path)) {
    return "GET, HEAD, POST";
  }
  if (USER_ACCESS_STATUS.test(path)) {
    return "PATCH";
  }
  return "GET, HEAD";
}

const accessStatusSchema = z
  .object({
    accion: z.enum(ACCIONES_ESTADO_USUARIO),
    motivo: z.string().max(500).optional()
  })
  .strict();

const userIdParamsSchema = z
  .object({ userId: z.string().refine(isUuid, "El userId debe ser un UUID.") })
  .strict();
const buyerIdParamsSchema = z
  .object({
    buyerId: z.string().refine(isUuid, "El buyerId debe ser un UUID.")
  })
  .strict();
const sellerIdParamsSchema = z
  .object({
    sellerId: z.string().refine(isUuid, "El sellerId debe ser un UUID.")
  })
  .strict();
const warehouseIdParamsSchema = z
  .object({
    warehouseId: z.string().refine(isUuid, "El warehouseId debe ser un UUID.")
  })
  .strict();
const productIdParamsSchema = z
  .object({
    productId: z.string().refine(isUuid, "El productId debe ser un UUID.")
  })
  .strict();
const orderIdParamsSchema = z
  .object({
    orderId: z.string().refine(isUuid, "El orderId debe ser un UUID.")
  })
  .strict();

const listUsersSchema = z
  .object({
    rol: z.enum(ROLES_ADMIN).optional(),
    estado: z.enum(ESTADOS_USUARIO_ADMIN).optional(),
    search: SEARCH_FIELD,
    ...PAGE_FIELDS
  })
  .strict();

const listBuyersSchema = z
  .object({
    estadoComercial: z.enum(ESTADOS_COMPRADOR_ADMIN).optional(),
    search: SEARCH_FIELD,
    ...PAGE_FIELDS
  })
  .strict();

const listSellersSchema = z
  .object({
    estado: z.enum(ESTADOS_VENDEDOR_ADMIN).optional(),
    search: SEARCH_FIELD,
    ...PAGE_FIELDS
  })
  .strict();

const listWarehousesSchema = z
  .object({
    estado: z.enum(ESTADOS_BODEGA_ADMIN).optional(),
    vendedorId: z
      .string()
      .refine(isUuid, "El vendedorId debe ser un UUID.")
      .optional(),
    search: SEARCH_FIELD,
    ...PAGE_FIELDS
  })
  .strict();

const listProductsSchema = z
  .object({
    estado: z.enum(ESTADOS_PRODUCTO_ADMIN).optional(),
    categoria: z.enum(CATEGORIAS_PRODUCTO).optional(),
    tipoEntrega: z.enum(TIPOS_ENTREGA_ADMIN).optional(),
    vendedorId: z
      .string()
      .refine(isUuid, "El vendedorId debe ser un UUID.")
      .optional(),
    search: SEARCH_FIELD,
    ...PAGE_FIELDS
  })
  .strict();

const listInventorySchema = z
  .object({
    bodegaId: z
      .string()
      .refine(isUuid, "El bodegaId debe ser un UUID.")
      .optional(),
    productoId: z
      .string()
      .refine(isUuid, "El productoId debe ser un UUID.")
      .optional(),
    vendedorId: z
      .string()
      .refine(isUuid, "El vendedorId debe ser un UUID.")
      .optional(),
    search: SEARCH_FIELD,
    ...PAGE_FIELDS
  })
  .strict();

const listMovementsSchema = z
  .object({
    bodegaId: z
      .string()
      .refine(isUuid, "El bodegaId debe ser un UUID.")
      .optional(),
    productoId: z
      .string()
      .refine(isUuid, "El productoId debe ser un UUID.")
      .optional(),
    ...PAGE_FIELDS
  })
  .strict();

const listOrdersSchema = z
  .object({
    estado: z.enum(ESTADOS_PEDIDO_ADMIN).optional(),
    search: SEARCH_FIELD,
    ...PAGE_FIELDS
  })
  .strict();

const listPaymentsSchema = z
  .object({
    estado: z.enum(ESTADOS_PAGO_ADMIN).optional(),
    search: SEARCH_FIELD,
    ...PAGE_FIELDS
  })
  .strict();

export interface AdminRoutesDependencies {
  readonly authenticator: SessionAuthenticator;
  readonly getDashboard: GetAdminDashboard;
  readonly getReports: GetAdminReports;
  readonly listUsers: ListAdminUsers;
  readonly getUser: GetAdminUser;
  readonly listBuyers: ListAdminBuyers;
  readonly getBuyer: GetAdminBuyer;
  readonly listSellers: ListAdminSellers;
  readonly getSeller: GetAdminSeller;
  readonly listWarehouses: ListAdminWarehouses;
  readonly getWarehouse: GetAdminWarehouse;
  readonly listProducts: ListAdminProducts;
  readonly getProduct: GetAdminProduct;
  readonly listInventory: ListAdminInventory;
  readonly listMovements: ListAdminMovements;
  readonly listOrders: ListAdminOrders;
  readonly getOrder: GetAdminOrder;
  readonly listPayments: ListAdminPayments;
  readonly updateUserAccessStatus?: UpdateUserAccessStatus;
}

export function registerAdminRoutes(
  app: FastifyInstance,
  dependencies: AdminRoutesDependencies
): void {
  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] ?? "/";
    if (path !== "/api/v1/admin" && !path.startsWith("/api/v1/admin/")) {
      return;
    }
    if (
      request.method === "GET" ||
      request.method === "HEAD" ||
      request.method === "OPTIONS"
    ) {
      return;
    }
    if (isAllowedAdminWrite(request.method, path)) {
      return;
    }
    reply.header("allow", allowedMethodsFor(path));
    return reply.code(405).send({
      error: {
        codigo: "METODO_NO_PERMITIDO",
        mensaje:
          "El espacio administrativo solo permite consultas y las operaciones administrativas definidas.",
        correlationId: request.id
      }
    });
  });

  app.get("/api/v1/admin/dashboard", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const dashboard = await dependencies.getDashboard.execute(actor);
    return reply.code(200).send({ data: dashboard });
  });

  app.get("/api/v1/admin/reports", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const reports = await dependencies.getReports.execute(actor);
    return reply.code(200).send({ data: reports });
  });

  app.get("/api/v1/admin/users", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listUsersSchema, request.query ?? {});
    const users = await dependencies.listUsers.execute(actor, {
      rol: query.rol ?? null,
      estado: query.estado ?? null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: users });
  });

  app.get("/api/v1/admin/users/:userId", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const params = parse(userIdParamsSchema, request.params);
    const user = await dependencies.getUser.execute(actor, params.userId);
    return reply.code(200).send({ data: user });
  });

  if (dependencies.updateUserAccessStatus) {
    const updateUserAccessStatus = dependencies.updateUserAccessStatus;
    app.patch(
      "/api/v1/admin/users/:userId/access-status",
      async (request, reply) => {
        const actor = await adminOf(request, dependencies.authenticator);
        const params = parse(userIdParamsSchema, request.params);
        const body = parse(accessStatusSchema, request.body);
        const result = await updateUserAccessStatus.execute({
          actor,
          usuarioId: params.userId,
          accion: body.accion,
          ...(body.motivo !== undefined ? { motivo: body.motivo } : {}),
          correlationId: request.id
        });
        return reply.code(200).send({ data: result });
      }
    );
  }

  app.get("/api/v1/admin/buyers", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listBuyersSchema, request.query ?? {});
    const buyers = await dependencies.listBuyers.execute(actor, {
      estadoComercial: query.estadoComercial ?? null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: buyers });
  });

  app.get("/api/v1/admin/buyers/:buyerId", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const params = parse(buyerIdParamsSchema, request.params);
    const buyer = await dependencies.getBuyer.execute(actor, params.buyerId);
    return reply.code(200).send({ data: buyer });
  });

  app.get("/api/v1/admin/sellers", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listSellersSchema, request.query ?? {});
    const sellers = await dependencies.listSellers.execute(actor, {
      estado: query.estado ?? null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: sellers });
  });

  app.get("/api/v1/admin/sellers/:sellerId", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const params = parse(sellerIdParamsSchema, request.params);
    const seller = await dependencies.getSeller.execute(actor, params.sellerId);
    return reply.code(200).send({ data: seller });
  });

  app.get("/api/v1/admin/warehouses", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listWarehousesSchema, request.query ?? {});
    const warehouses = await dependencies.listWarehouses.execute(actor, {
      estado: query.estado ?? null,
      vendedorId: query.vendedorId ?? null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: warehouses });
  });

  app.get("/api/v1/admin/warehouses/:warehouseId", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const params = parse(warehouseIdParamsSchema, request.params);
    const warehouse = await dependencies.getWarehouse.execute(
      actor,
      params.warehouseId
    );
    return reply.code(200).send({ data: warehouse });
  });

  app.get("/api/v1/admin/products", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listProductsSchema, request.query ?? {});
    const products = await dependencies.listProducts.execute(actor, {
      estado: query.estado ?? null,
      categoria: query.categoria ?? null,
      tipoEntrega: query.tipoEntrega ?? null,
      vendedorId: query.vendedorId ?? null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: products });
  });

  app.get("/api/v1/admin/products/:productId", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const params = parse(productIdParamsSchema, request.params);
    const product = await dependencies.getProduct.execute(
      actor,
      params.productId
    );
    return reply.code(200).send({ data: product });
  });

  app.get("/api/v1/admin/inventory", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listInventorySchema, request.query ?? {});
    const inventory = await dependencies.listInventory.execute(actor, {
      bodegaId: query.bodegaId ?? null,
      productoId: query.productoId ?? null,
      vendedorId: query.vendedorId ?? null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: inventory });
  });

  app.get("/api/v1/admin/inventory/movements", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listMovementsSchema, request.query ?? {});
    const movements = await dependencies.listMovements.execute(actor, {
      bodegaId: query.bodegaId ?? null,
      productoId: query.productoId ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: movements });
  });

  app.get("/api/v1/admin/orders", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listOrdersSchema, request.query ?? {});
    const orders = await dependencies.listOrders.execute(actor, {
      estado: query.estado ?? null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: orders });
  });

  app.get("/api/v1/admin/orders/:orderId", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const params = parse(orderIdParamsSchema, request.params);
    const order = await dependencies.getOrder.execute(actor, params.orderId);
    return reply.code(200).send({ data: order });
  });

  app.get("/api/v1/admin/payments", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listPaymentsSchema, request.query ?? {});
    const payments = await dependencies.listPayments.execute(actor, {
      estado: query.estado ?? null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: payments });
  });
}

async function adminOf(
  request: FastifyRequest,
  authenticator: SessionAuthenticator
): Promise<AuthenticatedUser> {
  const user = await authenticator.requireUser(request);
  authenticator.requireAdmin(user);
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
