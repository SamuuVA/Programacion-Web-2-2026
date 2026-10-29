import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import type { AppConfig } from "./config.js";
import { ApplicationError, type ErrorCode } from "./shared/domain/errors.js";
import { isValidCorrelationId } from "./shared/domain/value-objects.js";
import type { Clock, IdGenerator, PasswordHasher } from "./shared/application/ports.js";
import type { BuyerRegistrationStore } from "./modules/buyers/application/ports.js";
import { RegisterBuyer } from "./modules/buyers/application/register-buyer.js";
import { registerBuyerRoutes } from "./modules/buyers/interfaces/http/register-buyer-route.js";

export interface AppDependencies {
  readonly store: BuyerRegistrationStore;
  readonly hasher: PasswordHasher;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

const ROUTE_METHODS = new Map<string, readonly string[]>([
  ["/api/v1/buyers", ["POST"]],
  ["/health", ["GET", "HEAD"]],
  ["/ready", ["GET", "HEAD"]]
]);

export async function buildApp(
  config: AppConfig,
  dependencies: AppDependencies
): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      config.NODE_ENV === "test"
        ? false
        : {
            level: config.LOG_LEVEL
          },
    bodyLimit: 64 * 1024,
    genReqId: (request) => {
      const header = request.headers["x-correlation-id"];
      if (typeof header === "string") {
        const value = header.trim();
        if (isValidCorrelationId(value)) {
          return value;
        }
      }
      return randomUUID();
    }
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-correlation-id", request.id);
  });

  registerCors(app, config.CORS_ORIGINS);

  app.addHook("onClose", async () => {
    await dependencies.store.close();
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApplicationError) {
      const status = statusFor(error.code);
      const body: {
        error: {
          codigo: string;
          mensaje: string;
          correlationId: string;
          detalles?: Record<string, unknown>;
        };
      } = {
        error: {
          codigo: error.code,
          mensaje: error.message,
          correlationId: request.id
        }
      };
      if (
        error.details !== undefined &&
        error.code !== "DEPENDENCIA_NO_DISPONIBLE"
      ) {
        body.error.detalles = error.details;
      }
      return reply.code(status).send(body);
    }

    const frameworkStatus = frameworkErrorStatus(error);
    if (frameworkStatus !== undefined) {
      const message =
        frameworkStatus === 413
          ? "La solicitud excede el tamaño permitido."
          : "La solicitud no es válida.";
      return reply.code(frameworkStatus).send({
        error: {
          codigo: "VALIDACION_INVALIDA",
          mensaje: message,
          correlationId: request.id
        }
      });
    }

    request.log.error({ err: error }, "Error no controlado");
    return reply.code(500).send({
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Ocurrió un error interno.",
        correlationId: request.id
      }
    });
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "nexusmarket-backend",
    version: "0.1.0"
  }));

  app.get("/ready", async (_request, reply) => {
    try {
      await dependencies.store.healthCheck();
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  const useCase = new RegisterBuyer(
    dependencies.store,
    dependencies.hasher,
    dependencies.clock,
    dependencies.ids
  );
  registerBuyerRoutes(app, useCase);

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split("?")[0] ?? "/";
    const declaredMethods = ROUTE_METHODS.get(path);
    if (declaredMethods !== undefined && !declaredMethods.includes(request.method)) {
      const allowed = [...declaredMethods];
      if (config.CORS_ORIGINS.length > 0) {
        allowed.push("OPTIONS");
      }
      reply.header("allow", allowed.join(", "));
      return reply.code(405).send({
        error: {
          codigo: "METODO_NO_PERMITIDO",
          mensaje: "El método HTTP no está permitido para esta ruta.",
          correlationId: request.id
        }
      });
    }

    return reply.code(404).send({
      error: {
        codigo: "RUTA_NO_ENCONTRADA",
        mensaje: "La ruta solicitada no existe.",
        correlationId: request.id
      }
    });
  });

  return app;
}

function registerCors(app: FastifyInstance, origins: readonly string[]): void {
  if (origins.length === 0) {
    return;
  }

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (typeof origin !== "string" || !origins.includes(origin)) {
      return;
    }

    reply.header("access-control-allow-origin", origin);
    reply.header("vary", "Origin");
    reply.header("access-control-expose-headers", "x-correlation-id");

    if (request.method === "OPTIONS") {
      reply.header("access-control-allow-methods", "GET, POST, OPTIONS");
      reply.header(
        "access-control-allow-headers",
        "content-type, x-correlation-id"
      );
      reply.header("access-control-max-age", "600");
      return reply.code(204).send();
    }
  });
}

function statusFor(code: ErrorCode): number {
  switch (code) {
    case "VALIDACION_INVALIDA":
      return 400;
    case "CONFLICTO_UNICIDAD":
      return 409;
    case "REGLA_NEGOCIO_INCUMPLIDA":
      return 422;
    case "NO_AUTORIZADO":
      return 403;
    case "DEPENDENCIA_NO_DISPONIBLE":
      return 503;
    case "RUTA_NO_ENCONTRADA":
      return 404;
    case "METODO_NO_PERMITIDO":
      return 405;
  }
}

function frameworkErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (statusCode === 400 || statusCode === 413 || statusCode === 415) {
    return statusCode;
  }
  return undefined;
}
