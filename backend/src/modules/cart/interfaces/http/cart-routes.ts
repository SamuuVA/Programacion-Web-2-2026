import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import { isUuid } from "../../../../shared/domain/value-objects.js";
import type {
  AddCartItem,
  GetCart,
  RemoveCartItem,
  UpdateCartItem
} from "../../application/cart-use-cases.js";
import type { CartView } from "../../application/ports.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";

const addBodySchema = z
  .object({
    productoId: z.string().refine(isUuid, "El productoId debe ser un UUID."),
    cantidad: z.number().int().min(1).max(999)
  })
  .strict();

const updateBodySchema = z
  .object({
    cantidad: z.number().int().min(1).max(999)
  })
  .strict();

const productParamsSchema = z
  .object({
    productoId: z.string().refine(isUuid, "El productoId debe ser un UUID.")
  })
  .strict();

export interface CartRoutesDependencies {
  readonly authenticator: SessionAuthenticator;
  readonly getCart: GetCart;
  readonly addItem: AddCartItem;
  readonly updateItem: UpdateCartItem;
  readonly removeItem: RemoveCartItem;
}

export function registerCartRoutes(
  app: FastifyInstance,
  dependencies: CartRoutesDependencies
): void {
  app.get("/api/v1/cart", async (request, reply) => {
    const compradorId = await buyerOf(request, dependencies.authenticator);
    const cart = await dependencies.getCart.execute(compradorId);
    return reply.code(200).send({ data: cart });
  });

  app.post("/api/v1/cart/items", async (request, reply) => {
    const compradorId = await buyerOf(request, dependencies.authenticator);
    const body = parse(addBodySchema, request.body);
    const cart = await dependencies.addItem.execute(compradorId, body);
    return reply.code(200).send({ data: cart });
  });

  app.patch("/api/v1/cart/items/:productoId", async (request, reply) => {
    const compradorId = await buyerOf(request, dependencies.authenticator);
    const params = parse(productParamsSchema, request.params);
    const body = parse(updateBodySchema, request.body);
    const cart = await dependencies.updateItem.execute(compradorId, {
      productoId: params.productoId,
      cantidad: body.cantidad
    });
    return reply.code(200).send({ data: cart });
  });

  app.delete("/api/v1/cart/items/:productoId", async (request, reply) => {
    const compradorId = await buyerOf(request, dependencies.authenticator);
    const params = parse(productParamsSchema, request.params);
    const cart = await dependencies.removeItem.execute(
      compradorId,
      params.productoId
    );
    return reply.code(200).send({ data: cart });
  });
}

async function buyerOf(
  request: Parameters<SessionAuthenticator["requireUser"]>[0],
  authenticator: SessionAuthenticator
): Promise<string> {
  const user = await authenticator.requireUser(request);
  return authenticator.requireBuyer(user);
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

export function serializeCart(cart: CartView): CartView {
  return cart;
}
