import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import type { RegisterSeller } from "../../application/register-seller.js";
import type { SessionAuthenticator } from "../../../identity/interfaces/http/session.js";

const bodySchema = z
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
    nombreComercial: z.string().min(1).max(120),
    bodega: z
      .object({
        nombre: z.string().min(1).max(120),
        ubicacion: z.string().min(1).max(200)
      })
      .strict()
  })
  .strict();

export function registerSellerRoutes(
  app: FastifyInstance,
  authenticator: SessionAuthenticator,
  useCase: RegisterSeller
): void {
  app.post("/api/v1/admin/sellers", async (request, reply) => {
    const user = await authenticator.requireUser(request);
    authenticator.requireAdmin(user);

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("La solicitud no es válida.", {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    const result = await useCase.execute({
      ...parsed.data,
      actor: user,
      correlationId: request.id
    });
    return reply.code(201).send({ data: result });
  });
}
