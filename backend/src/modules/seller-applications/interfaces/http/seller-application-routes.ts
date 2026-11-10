import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import { isUuid } from "../../../../shared/domain/value-objects.js";
import type { AuthenticatedUser } from "../../../identity/application/ports.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";
import {
  ESTADOS_SOLICITUD_VENDEDOR,
  type EstadoSolicitudVendedor
} from "../../domain/solicitud-vendedor.js";
import {
  ApproveSellerApplication,
  GetAdminSellerApplication,
  GetOwnSellerApplication,
  ListAdminSellerApplications,
  RejectSellerApplication,
  SubmitSellerApplication
} from "../../application/use-cases.js";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

const submitSchema = z
  .object({
    nombreComercial: z.string().min(1).max(120),
    nombreBodega: z.string().min(1).max(120),
    ubicacionBodega: z.string().min(1).max(200)
  })
  .strict();

const rejectSchema = z
  .object({
    motivo: z.string().min(3).max(500)
  })
  .strict();

const listSchema = z
  .object({
    estado: z.enum(ESTADOS_SOLICITUD_VENDEDOR).optional(),
    search: z.string().trim().min(1).max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(PAGE_SIZE_MAX)
      .default(PAGE_SIZE_DEFAULT)
  })
  .strict();

const applicationParamsSchema = z
  .object({
    applicationId: z
      .string()
      .refine(isUuid, "El applicationId debe ser un UUID.")
  })
  .strict();

export interface SellerApplicationRoutesDependencies {
  readonly authenticator: SessionAuthenticator;
  readonly submit: SubmitSellerApplication;
  readonly getOwn: GetOwnSellerApplication;
  readonly listAdmin: ListAdminSellerApplications;
  readonly getAdmin: GetAdminSellerApplication;
  readonly approve: ApproveSellerApplication;
  readonly reject: RejectSellerApplication;
}

/**
 * Rutas de autoservicio del comprador y de revisión administrativa.
 *
 * El backend vuelve a comprobar rol, estado y propiedad. El cuerpo nunca
 * incluye el usuario objetivo ni el rol: se derivan de la sesión y de la
 * solicitud persistida.
 */
export function registerSellerApplicationRoutes(
  app: FastifyInstance,
  dependencies: SellerApplicationRoutesDependencies
): void {
  app.post("/api/v1/buyer/seller-application", async (request, reply) => {
    const actor = await dependencies.authenticator.requireUser(request);
    dependencies.authenticator.requireBuyer(actor);
    const body = parse(submitSchema, request.body);
    const application = await dependencies.submit.execute({
      actor,
      nombreComercial: body.nombreComercial,
      nombreBodega: body.nombreBodega,
      ubicacionBodega: body.ubicacionBodega,
      correlationId: request.id
    });
    return reply.code(201).send({ data: application });
  });

  app.get("/api/v1/buyer/seller-application", async (request, reply) => {
    const actor = await dependencies.authenticator.requireUser(request);
    const application = await dependencies.getOwn.execute(actor);
    return reply.code(200).send({ data: { solicitud: application } });
  });

  app.get("/api/v1/admin/seller-applications", async (request, reply) => {
    const actor = await adminOf(request, dependencies.authenticator);
    const query = parse(listSchema, request.query ?? {});
    const page = await dependencies.listAdmin.execute(actor, {
      estado: (query.estado ?? null) as EstadoSolicitudVendedor | null,
      search: query.search ?? null,
      page: query.page,
      pageSize: query.pageSize
    });
    return reply.code(200).send({ data: page });
  });

  app.get(
    "/api/v1/admin/seller-applications/:applicationId",
    async (request, reply) => {
      const actor = await adminOf(request, dependencies.authenticator);
      const params = parse(applicationParamsSchema, request.params);
      const application = await dependencies.getAdmin.execute(
        actor,
        params.applicationId
      );
      return reply.code(200).send({ data: application });
    }
  );

  app.post(
    "/api/v1/admin/seller-applications/:applicationId/approve",
    async (request, reply) => {
      const actor = await adminOf(request, dependencies.authenticator);
      const params = parse(applicationParamsSchema, request.params);
      const result = await dependencies.approve.execute({
        actor,
        applicationId: params.applicationId,
        correlationId: request.id
      });
      return reply.code(200).send({ data: result });
    }
  );

  app.post(
    "/api/v1/admin/seller-applications/:applicationId/reject",
    async (request, reply) => {
      const actor = await adminOf(request, dependencies.authenticator);
      const params = parse(applicationParamsSchema, request.params);
      const body = parse(rejectSchema, request.body);
      const application = await dependencies.reject.execute({
        actor,
        applicationId: params.applicationId,
        motivo: body.motivo,
        correlationId: request.id
      });
      return reply.code(200).send({ data: application });
    }
  );
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
