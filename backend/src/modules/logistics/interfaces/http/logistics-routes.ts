import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import { isUuid } from "../../../../shared/domain/value-objects.js";
import { RESULTADOS_ENTREGA } from "../../domain/envio.js";
import type {
  ConfirmDelivery,
  DispatchOrder,
  GetLogisticsOrder,
  GetLogisticsProfile,
  GetLogisticsSummary,
  ListLogisticsInventory,
  ListLogisticsOrders,
  ListLogisticsWarehouses,
  PrepareShipment,
  RegisterLogisticsOperator
} from "../../application/use-cases.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";

const ESTADOS_PEDIDO = [
  "PENDIENTE_DE_PAGO",
  "PAGADO",
  "EN_PREPARACION",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
  "CERRADO"
] as const;

const orderParamsSchema = z
  .object({
    orderId: z.string().refine(isUuid, "El orderId debe ser un UUID.")
  })
  .strict();

const shipmentParamsSchema = z
  .object({
    shipmentId: z.string().refine(isUuid, "El shipmentId debe ser un UUID.")
  })
  .strict();

const listOrdersSchema = z
  .object({
    estado: z.enum(ESTADOS_PEDIDO).optional()
  })
  .strict();

const prepareSchema = z
  .object({
    bodegaId: z.string().refine(isUuid, "El bodegaId debe ser un UUID."),
    transportista: z.string().max(120).nullable().optional(),
    idempotencyKey: z.string().min(1).max(100)
  })
  .strict();

const dispatchSchema = z
  .object({
    transportista: z.string().max(120).nullable().optional(),
    trackingNumber: z.string().max(200).nullable().optional(),
    idempotencyKey: z.string().min(1).max(100)
  })
  .strict();

const deliverySchema = z
  .object({
    resultado: z.enum(RESULTADOS_ENTREGA),
    evidencia: z
      .object({
        tipo: z.string().max(200).nullable().optional(),
        referencia: z.string().max(200).nullable().optional(),
        nota: z.string().max(500).nullable().optional(),
        motivo: z.string().max(200).nullable().optional()
      })
      .strict()
      .optional(),
    idempotencyKey: z.string().min(1).max(100)
  })
  .strict();

const registerOperatorSchema = z
  .object({
    nombreCompleto: z.string().min(1),
    correoElectronico: z.string().min(1),
    documentoIdentidad: z
      .object({
        tipo: z.string().min(1),
        pais: z.string().min(1),
        numero: z.string().min(1)
      })
      .strict(),
    credencial: z.string().min(12).max(128),
    nombreOperador: z.string().min(1).max(120),
    bodegaIds: z
      .array(z.string().refine(isUuid, "Cada bodega debe ser un UUID."))
      .min(1)
  })
  .strict();

export interface LogisticsRoutesDependencies {
  readonly authenticator: SessionAuthenticator;
  readonly getProfile: GetLogisticsProfile;
  readonly listWarehouses: ListLogisticsWarehouses;
  readonly listInventory: ListLogisticsInventory;
  readonly getSummary: GetLogisticsSummary;
  readonly listOrders: ListLogisticsOrders;
  readonly getOrder: GetLogisticsOrder;
  readonly prepare: PrepareShipment;
  readonly dispatch: DispatchOrder;
  readonly deliver: ConfirmDelivery;
  readonly registerOperator: RegisterLogisticsOperator;
}

export function registerLogisticsRoutes(
  app: FastifyInstance,
  dependencies: LogisticsRoutesDependencies
): void {
  app.get("/api/v1/logistics/profile", async (request, reply) => {
    const usuarioId = await logisticsOf(request, dependencies.authenticator);
    const profile = await dependencies.getProfile.execute(usuarioId);
    return reply.code(200).send({ data: profile });
  });

  app.get("/api/v1/logistics/warehouses", async (request, reply) => {
    const usuarioId = await logisticsOf(request, dependencies.authenticator);
    const warehouses = await dependencies.listWarehouses.execute(usuarioId);
    return reply.code(200).send({ data: warehouses });
  });

  app.get("/api/v1/logistics/inventory", async (request, reply) => {
    const usuarioId = await logisticsOf(request, dependencies.authenticator);
    const inventory = await dependencies.listInventory.execute(usuarioId);
    return reply.code(200).send({ data: inventory });
  });

  app.get("/api/v1/logistics/summary", async (request, reply) => {
    const usuarioId = await logisticsOf(request, dependencies.authenticator);
    const summary = await dependencies.getSummary.execute(usuarioId);
    return reply.code(200).send({ data: summary });
  });

  app.get("/api/v1/logistics/orders", async (request, reply) => {
    const usuarioId = await logisticsOf(request, dependencies.authenticator);
    const query = parse(listOrdersSchema, request.query ?? {});
    const orders = await dependencies.listOrders.execute(
      usuarioId,
      query.estado ?? null
    );
    return reply.code(200).send({ data: orders });
  });

  app.get("/api/v1/logistics/orders/:orderId", async (request, reply) => {
    const usuarioId = await logisticsOf(request, dependencies.authenticator);
    const params = parse(orderParamsSchema, request.params);
    const order = await dependencies.getOrder.execute(usuarioId, params.orderId);
    return reply.code(200).send({ data: order });
  });

  app.post("/api/v1/logistics/orders/:orderId/prepare", async (request, reply) => {
    const usuarioId = await logisticsOf(request, dependencies.authenticator);
    const params = parse(orderParamsSchema, request.params);
    const body = parse(prepareSchema, request.body);
    const result = await dependencies.prepare.execute(
      usuarioId,
      params.orderId,
      {
        bodegaId: body.bodegaId,
        ...(body.transportista === undefined
          ? {}
          : { transportista: body.transportista }),
        idempotencyKey: body.idempotencyKey
      },
      request.id
    );
    return reply.code(result.duplicado ? 200 : 201).send({ data: result });
  });

  app.post(
    "/api/v1/logistics/shipments/:shipmentId/dispatch",
    async (request, reply) => {
      const usuarioId = await logisticsOf(request, dependencies.authenticator);
      const params = parse(shipmentParamsSchema, request.params);
      const body = parse(dispatchSchema, request.body);
      const result = await dependencies.dispatch.execute(
        usuarioId,
        params.shipmentId,
        {
          ...(body.transportista === undefined
            ? {}
            : { transportista: body.transportista }),
          ...(body.trackingNumber === undefined
            ? {}
            : { trackingNumber: body.trackingNumber }),
          idempotencyKey: body.idempotencyKey
        },
        request.id
      );
      return reply.code(result.duplicado ? 200 : 201).send({ data: result });
    }
  );

  app.post(
    "/api/v1/logistics/shipments/:shipmentId/delivery",
    async (request, reply) => {
      const usuarioId = await logisticsOf(request, dependencies.authenticator);
      const params = parse(shipmentParamsSchema, request.params);
      const body = parse(deliverySchema, request.body);
      const result = await dependencies.deliver.execute(
        usuarioId,
        params.shipmentId,
        {
          resultado: body.resultado,
          evidencia: body.evidencia ?? {},
          idempotencyKey: body.idempotencyKey
        },
        request.id
      );
      return reply.code(result.duplicado ? 200 : 201).send({ data: result });
    }
  );

  app.post("/api/v1/admin/logistics-operators", async (request, reply) => {
    const user = await dependencies.authenticator.requireUser(request);
    dependencies.authenticator.requireAdmin(user);
    const body = parse(registerOperatorSchema, request.body);
    const result = await dependencies.registerOperator.execute(user, body);
    return reply.code(201).send({ data: result });
  });
}

async function logisticsOf(
  request: Parameters<SessionAuthenticator["requireUser"]>[0],
  authenticator: SessionAuthenticator
): Promise<string> {
  const user = await authenticator.requireUser(request);
  return authenticator.requireLogistics(user);
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
