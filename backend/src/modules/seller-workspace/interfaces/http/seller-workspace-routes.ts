import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import { isUuid } from "../../../../shared/domain/value-objects.js";
import { CATEGORIAS_PRODUCTO } from "../../../catalog/domain/producto.js";
import { TIPOS_ENTREGA_VENDEDOR } from "../../domain/producto-vendedor.js";
import type {
  AddSellerProductImage,
  CreateSellerProduct,
  CreateSellerWarehouse,
  DiscontinueSellerProduct,
  GetSellerOrder,
  GetSellerProduct,
  GetSellerProfile,
  ListSellerInventory,
  ListSellerOrders,
  ListSellerProducts,
  ListSellerWarehouses,
  PublishSellerProduct,
  RegisterInventoryIngress,
  RemoveSellerProductImage,
  SuspendSellerProduct,
  UpdateSellerProduct,
  UpdateSellerProfile,
  UpdateSellerWarehouse
} from "../../application/use-cases.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";

const productFields = {
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  categoria: z.enum(CATEGORIAS_PRODUCTO),
  tipoEntrega: z.enum(TIPOS_ENTREGA_VENDEDOR),
  sku: z.string().min(1),
  precioCentavos: z.number().int().min(1),
  moneda: z.string().length(3)
} as const;

const imageFields = {
  url: z.string().min(1),
  alt: z.string().optional()
} as const;

const createProductSchema = z
  .object({
    ...productFields,
    imagenes: z.array(z.object(imageFields).strict()).optional()
  })
  .strict();

const updateProductSchema = z
  .object(productFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Debes enviar al menos un campo para actualizar."
  });

const addImageSchema = z.object(imageFields).strict();

const createWarehouseSchema = z
  .object({
    nombre: z.string().min(1),
    ubicacion: z.string().min(1)
  })
  .strict();

const updateWarehouseSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    ubicacion: z.string().min(1).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Debes enviar al menos un campo para actualizar."
  });

const ingressSchema = z
  .object({
    productoId: z.string().refine(isUuid, "El productoId debe ser un UUID."),
    bodegaId: z.string().refine(isUuid, "El bodegaId debe ser un UUID."),
    cantidad: z.number().int().min(1),
    idempotencyKey: z.string().min(1).max(100),
    motivo: z.string().nullable().optional()
  })
  .strict();

const profileSchema = z
  .object({
    nombreComercial: z.string().min(1)
  })
  .strict();

const productParamsSchema = z
  .object({
    productId: z.string().refine(isUuid, "El productId debe ser un UUID.")
  })
  .strict();

const imageParamsSchema = z
  .object({
    productId: z.string().refine(isUuid, "El productId debe ser un UUID."),
    imageId: z.string().refine(isUuid, "El imageId debe ser un UUID.")
  })
  .strict();

const warehouseParamsSchema = z
  .object({
    warehouseId: z.string().refine(isUuid, "El warehouseId debe ser un UUID.")
  })
  .strict();

const orderParamsSchema = z
  .object({
    orderId: z.string().refine(isUuid, "El orderId debe ser un UUID.")
  })
  .strict();

export interface SellerWorkspaceRoutesDependencies {
  readonly authenticator: SessionAuthenticator;
  readonly getProfile: GetSellerProfile;
  readonly updateProfile: UpdateSellerProfile;
  readonly listProducts: ListSellerProducts;
  readonly getProduct: GetSellerProduct;
  readonly createProduct: CreateSellerProduct;
  readonly updateProduct: UpdateSellerProduct;
  readonly addImage: AddSellerProductImage;
  readonly removeImage: RemoveSellerProductImage;
  readonly publishProduct: PublishSellerProduct;
  readonly suspendProduct: SuspendSellerProduct;
  readonly discontinueProduct: DiscontinueSellerProduct;
  readonly listWarehouses: ListSellerWarehouses;
  readonly createWarehouse: CreateSellerWarehouse;
  readonly updateWarehouse: UpdateSellerWarehouse;
  readonly listInventory: ListSellerInventory;
  readonly registerIngress: RegisterInventoryIngress;
  readonly listOrders: ListSellerOrders;
  readonly getOrder: GetSellerOrder;
}

export function registerSellerWorkspaceRoutes(
  app: FastifyInstance,
  dependencies: SellerWorkspaceRoutesDependencies
): void {
  app.get("/api/v1/seller/profile", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const profile = await dependencies.getProfile.execute(actor);
    return reply.code(200).send({ data: profile });
  });

  app.patch("/api/v1/seller/profile", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const body = parse(profileSchema, request.body);
    const profile = await dependencies.updateProfile.execute(actor, body);
    return reply.code(200).send({ data: profile });
  });

  app.get("/api/v1/seller/products", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const products = await dependencies.listProducts.execute(actor);
    return reply.code(200).send({ data: products });
  });

  app.post("/api/v1/seller/products", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const body = parse(createProductSchema, request.body);
    const product = await dependencies.createProduct.execute(actor, {
      datos: body,
      ...(body.imagenes === undefined ? {} : { imagenes: body.imagenes })
    });
    return reply.code(201).send({ data: product });
  });

  app.get("/api/v1/seller/products/:productId", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const params = parse(productParamsSchema, request.params);
    const product = await dependencies.getProduct.execute(actor, params.productId);
    return reply.code(200).send({ data: product });
  });

  app.patch("/api/v1/seller/products/:productId", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const params = parse(productParamsSchema, request.params);
    const body = parse(updateProductSchema, request.body);
    const product = await dependencies.updateProduct.execute(
      actor,
      params.productId,
      body
    );
    return reply.code(200).send({ data: product });
  });

  app.post("/api/v1/seller/products/:productId/images", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const params = parse(productParamsSchema, request.params);
    const body = parse(addImageSchema, request.body);
    const product = await dependencies.addImage.execute(
      actor,
      params.productId,
      body
    );
    return reply.code(201).send({ data: product });
  });

  app.delete(
    "/api/v1/seller/products/:productId/images/:imageId",
    async (request, reply) => {
      const actor = await sellerOf(request, dependencies.authenticator);
      const params = parse(imageParamsSchema, request.params);
      const product = await dependencies.removeImage.execute(
        actor,
        params.productId,
        params.imageId
      );
      return reply.code(200).send({ data: product });
    }
  );

  app.post("/api/v1/seller/products/:productId/publish", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const params = parse(productParamsSchema, request.params);
    const product = await dependencies.publishProduct.execute(
      actor,
      params.productId
    );
    return reply.code(200).send({ data: product });
  });

  app.post("/api/v1/seller/products/:productId/suspend", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const params = parse(productParamsSchema, request.params);
    const product = await dependencies.suspendProduct.execute(
      actor,
      params.productId
    );
    return reply.code(200).send({ data: product });
  });

  app.post(
    "/api/v1/seller/products/:productId/discontinue",
    async (request, reply) => {
      const actor = await sellerOf(request, dependencies.authenticator);
      const params = parse(productParamsSchema, request.params);
      const product = await dependencies.discontinueProduct.execute(
        actor,
        params.productId
      );
      return reply.code(200).send({ data: product });
    }
  );

  app.get("/api/v1/seller/warehouses", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const warehouses = await dependencies.listWarehouses.execute(actor);
    return reply.code(200).send({ data: warehouses });
  });

  app.post("/api/v1/seller/warehouses", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const body = parse(createWarehouseSchema, request.body);
    const warehouse = await dependencies.createWarehouse.execute(actor, body);
    return reply.code(201).send({ data: warehouse });
  });

  app.patch("/api/v1/seller/warehouses/:warehouseId", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const params = parse(warehouseParamsSchema, request.params);
    const body = parse(updateWarehouseSchema, request.body);
    const warehouse = await dependencies.updateWarehouse.execute(
      actor,
      params.warehouseId,
      body
    );
    return reply.code(200).send({ data: warehouse });
  });

  app.get("/api/v1/seller/inventory", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const inventory = await dependencies.listInventory.execute(actor);
    return reply.code(200).send({ data: inventory });
  });

  app.post("/api/v1/seller/inventory/ingresos", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const body = parse(ingressSchema, request.body);
    const result = await dependencies.registerIngress.execute(actor, body);
    return reply.code(result.duplicado ? 200 : 201).send({ data: result });
  });

  app.get("/api/v1/seller/orders", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const orders = await dependencies.listOrders.execute(actor);
    return reply.code(200).send({ data: orders });
  });

  app.get("/api/v1/seller/orders/:orderId", async (request, reply) => {
    const actor = await sellerOf(request, dependencies.authenticator);
    const params = parse(orderParamsSchema, request.params);
    const order = await dependencies.getOrder.execute(actor, params.orderId);
    return reply.code(200).send({ data: order });
  });
}

async function sellerOf(
  request: Parameters<SessionAuthenticator["requireUser"]>[0],
  authenticator: SessionAuthenticator
): Promise<{ readonly usuarioId: string; readonly sellerId: string }> {
  const user = await authenticator.requireUser(request);
  const sellerId = authenticator.requireSeller(user);
  return { usuarioId: user.usuarioId, sellerId };
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
