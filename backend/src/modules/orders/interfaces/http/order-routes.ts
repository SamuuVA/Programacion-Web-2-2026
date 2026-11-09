import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ResourceNotFoundError, ValidationError } from "../../../../shared/domain/errors.js";
import { isUuid } from "../../../../shared/domain/value-objects.js";
import type { Checkout, GetOrder, ListOrders } from "../../application/checkout.js";
import { RESULTADOS_PAGO_SIMULADO } from "../../application/ports.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";

const checkoutBodySchema = z
  .object({
    idempotencyKey: z.string().min(1).max(100),
    direccionEntregaId: z
      .string()
      .refine(isUuid, "La dirección debe ser un UUID.")
      .nullable()
      .optional(),
    confirmarPrecio: z.boolean().optional(),
    resultadoPagoSimulado: z.enum(RESULTADOS_PAGO_SIMULADO).optional()
  })
  .strict();

const orderParamsSchema = z
  .object({
    orderId: z.string().refine(isUuid, "El pedido debe ser un UUID.")
  })
  .strict();

export interface OrderRoutesDependencies {
  readonly authenticator: SessionAuthenticator;
  readonly checkout: Checkout;
  readonly listOrders: ListOrders;
  readonly getOrder: GetOrder;
}

export function registerOrderRoutes(
  app: FastifyInstance,
  dependencies: OrderRoutesDependencies
): void {
  app.post("/api/v1/checkout", async (request, reply) => {
    const user = await dependencies.authenticator.requireUser(request);
    const compradorId = dependencies.authenticator.requireBuyer(user);
    const body = parse(checkoutBodySchema, request.body);
    const result = await dependencies.checkout.execute(compradorId, {
      ...body,
      correlationId: request.id
    });
    const status = result.estado === "DESCONOCIDO" ? 202 : 201;
    return reply.code(status).send({ data: result });
  });

  app.get("/api/v1/orders", async (request, reply) => {
    const user = await dependencies.authenticator.requireUser(request);
    const compradorId = dependencies.authenticator.requireBuyer(user);
    const orders = await dependencies.listOrders.execute(compradorId);
    return reply.code(200).send({ data: orders });
  });

  app.get("/api/v1/orders/:orderId", async (request, reply) => {
    const user = await dependencies.authenticator.requireUser(request);
    const compradorId = dependencies.authenticator.requireBuyer(user);
    const params = parse(orderParamsSchema, request.params);
    const order = await dependencies.getOrder.execute(compradorId, params.orderId);
    if (order === null) {
      throw new ResourceNotFoundError("El pedido no existe o no pertenece al comprador.");
    }
    return reply.code(200).send({ data: order });
  });
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
