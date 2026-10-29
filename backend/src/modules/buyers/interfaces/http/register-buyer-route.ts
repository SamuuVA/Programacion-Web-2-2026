import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ValidationError } from "../../../../shared/domain/errors.js";
import type { RegisterBuyer } from "../../application/register-buyer.js";

const documentoSchema = z
  .object({
    tipo: z.string().min(1),
    pais: z.string().min(1),
    numero: z.string().min(1)
  })
  .strict();

const bodySchema = z
  .object({
    nombreCompleto: z.string().min(1),
    correoElectronico: z.string().min(1),
    documentoIdentidad: documentoSchema,
    credencial: z
      .string()
      .min(1)
      .refine((value) => {
        const length = [...value].length;
        return length >= 12 && length <= 128;
      }, "La credencial debe tener entre 12 y 128 caracteres.")
  })
  .strict();

export function registerBuyerRoutes(app: FastifyInstance, useCase: RegisterBuyer): void {
  app.post("/api/v1/buyers", async (request, reply) => {
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
      correlationId: request.id
    });

    return reply.code(201).send({ data: result });
  });
}
