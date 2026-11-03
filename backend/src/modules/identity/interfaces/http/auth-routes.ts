import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../../../../config.js";
import { ValidationError } from "../../../../shared/domain/errors.js";
import { SESSION_TTL_SECONDS, type LoginUser } from "../../application/login-user.js";
import type { LogoutUser } from "../../application/logout-user.js";
import {
  clearSessionCookie,
  extractSessionToken,
  SessionAuthenticator,
  setSessionCookie
} from "./session.js";

const loginBodySchema = z
  .object({
    correoElectronico: z.string().min(1),
    credencial: z.string().min(1).max(128)
  })
  .strict();

export function registerAuthRoutes(
  app: FastifyInstance,
  config: AppConfig,
  authenticator: SessionAuthenticator,
  login: LoginUser,
  logout: LogoutUser
): void {
  app.post("/api/v1/auth/login", async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("La solicitud no es válida.", {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    const result = await login.execute({
      ...parsed.data,
      correlationId: request.id
    });
    setSessionCookie(
      reply,
      result.token,
      SESSION_TTL_SECONDS,
      config.NODE_ENV === "production"
    );
    return reply.code(200).send({ data: result });
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    await logout.execute(extractSessionToken(request));
    clearSessionCookie(reply, config.NODE_ENV === "production");
    return reply.code(204).send();
  });

  app.get("/api/v1/auth/session", async (request, reply) => {
    const user = await authenticator.requireUser(request);
    return reply.code(200).send({ data: { usuario: user } });
  });
}
