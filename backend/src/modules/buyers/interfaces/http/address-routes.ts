import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import type { DireccionEntrega } from "../../domain/direccion-entrega.js";
import type {
  CreateAddress,
  DeleteAddress,
  ListAddresses,
  SetPrincipalAddress,
  UpdateAddress
} from "../../application/address-use-cases.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";

const addressFields = {
  destinatario: z.string().min(1).max(120),
  telefono: z.string().min(1).max(30),
  linea1: z.string().min(1).max(160),
  linea2: z.string().max(160).nullable().optional(),
  ciudad: z.string().min(1).max(80),
  region: z.string().min(1).max(80),
  codigoPostal: z.string().max(20).nullable().optional(),
  pais: z.string().length(2).optional()
} as const;

const createBodySchema = z
  .object({
    ...addressFields,
    esPrincipal: z.boolean().optional()
  })
  .strict();

const updateBodySchema = z
  .object(addressFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Debes enviar al menos un campo para actualizar."
  });

const paramsSchema = z.object({ direccionId: z.string().min(1) }).strict();

export interface AddressRoutesDependencies {
  readonly authenticator: SessionAuthenticator;
  readonly list: ListAddresses;
  readonly create: CreateAddress;
  readonly update: UpdateAddress;
  readonly remove: DeleteAddress;
  readonly setPrincipal: SetPrincipalAddress;
}

export function registerAddressRoutes(
  app: FastifyInstance,
  dependencies: AddressRoutesDependencies
): void {
  app.get("/api/v1/buyers/me/addresses", async (request, reply) => {
    const user = await dependencies.authenticator.requireUser(request);
    const compradorId = dependencies.authenticator.requireBuyer(user);
    const addresses = await dependencies.list.execute(compradorId);
    return reply.code(200).send({ data: addresses.map(serializeAddress) });
  });

  app.post("/api/v1/buyers/me/addresses", async (request, reply) => {
    const user = await dependencies.authenticator.requireUser(request);
    const compradorId = dependencies.authenticator.requireBuyer(user);
    const body = parse(createBodySchema, request.body);
    const address = await dependencies.create.execute(compradorId, body);
    return reply.code(201).send({ data: serializeAddress(address) });
  });

  app.patch(
    "/api/v1/buyers/me/addresses/:direccionId",
    async (request, reply) => {
      const user = await dependencies.authenticator.requireUser(request);
      const compradorId = dependencies.authenticator.requireBuyer(user);
      const params = parse(paramsSchema, request.params);
      const body = parse(updateBodySchema, request.body);
      const address = await dependencies.update.execute(compradorId, {
        direccionId: params.direccionId,
        ...body
      });
      return reply.code(200).send({ data: serializeAddress(address) });
    }
  );

  app.delete(
    "/api/v1/buyers/me/addresses/:direccionId",
    async (request, reply) => {
      const user = await dependencies.authenticator.requireUser(request);
      const compradorId = dependencies.authenticator.requireBuyer(user);
      const params = parse(paramsSchema, request.params);
      await dependencies.remove.execute(compradorId, params.direccionId);
      return reply.code(204).send();
    }
  );

  app.post(
    "/api/v1/buyers/me/addresses/:direccionId/principal",
    async (request, reply) => {
      const user = await dependencies.authenticator.requireUser(request);
      const compradorId = dependencies.authenticator.requireBuyer(user);
      const params = parse(paramsSchema, request.params);
      await dependencies.setPrincipal.execute(compradorId, params.direccionId);
      return reply.code(204).send();
    }
  );
}

export function serializeAddress(
  address: DireccionEntrega
): Record<string, unknown> {
  return {
    id: address.id,
    destinatario: address.destinatario,
    telefono: address.telefono,
    linea1: address.linea1,
    linea2: address.linea2,
    ciudad: address.ciudad,
    region: address.region,
    codigoPostal: address.codigoPostal,
    pais: address.pais,
    esPrincipal: address.esPrincipal,
    creadaEn: address.creadaEn,
    actualizadaEn: address.actualizadaEn
  };
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
