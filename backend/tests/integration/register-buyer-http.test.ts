import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { BuyerRegistrationStore } from "../../src/modules/buyers/application/ports.js";
import { MemoryBuyerRegistrationStore } from "../../src/modules/buyers/infrastructure/memory-buyer-registration-store.js";
import { Argon2PasswordHasher } from "../../src/modules/identity/infrastructure/argon2-password-hasher.js";
import { DependencyUnavailableError } from "../../src/shared/domain/errors.js";
import type { CorreoElectronico } from "../../src/shared/domain/value-objects.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";

const PASSWORD = "correct horse battery staple";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const payload = {
  nombreCompleto: "Ana María Pérez",
  correoElectronico: "Ana.Perez@Example.COM",
  documentoIdentidad: {
    tipo: "CC",
    pais: "CO",
    numero: "123456789"
  },
  credencial: PASSWORD
};

class FailingHealthStore extends MemoryBuyerRegistrationStore {
  override async healthCheck(): Promise<void> {
    throw new DependencyUnavailableError("Base de datos no disponible.");
  }
}

class FailingLookupStore extends MemoryBuyerRegistrationStore {
  override async existsByEmail(_email: CorreoElectronico): Promise<boolean> {
    throw new DependencyUnavailableError("Base de datos no disponible.");
  }
}

function createApp(
  store: BuyerRegistrationStore = new MemoryBuyerRegistrationStore(),
  environment: Record<string, string> = {}
) {
  const config = loadConfig({
    NODE_ENV: "test",
    HOST: "127.0.0.1",
    PORT: "3000",
    PERSISTENCE: "memory",
    LOG_LEVEL: "silent",
    ...environment
  });
  let app: FastifyInstance;
  return {
    store,
    build: async () => {
      app = await buildApp(config, {
        store,
        hasher: new Argon2PasswordHasher(),
        clock: new FixedClock(),
        ids: new SequentialIds()
      });
      return app;
    }
  };
}

describe("Contrato HTTP de PI-01", () => {
  let current: FastifyInstance | undefined;

  beforeEach(() => {
    current = undefined;
  });

  afterEach(async () => {
    if (current) {
      await current.close();
    }
  });

  it("registra un comprador y responde 201 con el contrato declarado", async () => {
    const store = new MemoryBuyerRegistrationStore();
    const subject = createApp(store);
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: { "x-correlation-id": "corr-http-001" },
      payload
    });

    expect(response.statusCode).toBe(201);
    expect(response.headers["x-correlation-id"]).toBe("corr-http-001");
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    const body = response.json();
    expect(Object.keys(body)).toEqual(["data"]);
    expect(Object.keys(body.data).sort()).toEqual(
      [
        "usuarioId",
        "compradorId",
        "carritoId",
        "estadoUsuario",
        "estadoComercial",
        "correoNormalizado"
      ].sort()
    );
    expect(body.data).toMatchObject({
      estadoUsuario: "ACTIVO",
      estadoComercial: "HABILITADO",
      correoNormalizado: "ana.perez@example.com"
    });
    expect(body.data.usuarioId).toMatch(UUID_PATTERN);
    expect(body.data.compradorId).toMatch(UUID_PATTERN);
    expect(body.data.carritoId).toMatch(UUID_PATTERN);
    expect(response.body).not.toContain(PASSWORD);
    expect(response.body).not.toContain("$argon2id$");
    expect(response.body).not.toContain("credencial");

    const user = store.getUserByEmail("ana.perez@example.com");
    expect(user).toBeDefined();
    await expect(
      new Argon2PasswordHasher().verify(user!.credencial.value, PASSWORD)
    ).resolves.toBe(true);
  });

  it("genera una correlación cuando la cabecera no viene", async () => {
    const subject = createApp();
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      payload
    });

    expect(response.statusCode).toBe(201);
    expect(response.headers["x-correlation-id"]).toMatch(UUID_PATTERN);
  });

  it("reemplaza una correlación de más de 200 caracteres", async () => {
    const subject = createApp();
    current = await subject.build();
    const oversized = "x".repeat(201);

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: { "x-correlation-id": oversized },
      payload
    });

    expect(response.statusCode).toBe(201);
    expect(response.headers["x-correlation-id"]).not.toBe(oversized);
    expect(response.headers["x-correlation-id"]).toMatch(UUID_PATTERN);
  });

  it("reemplaza una correlación con caracteres no permitidos", async () => {
    const subject = createApp();
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: { "x-correlation-id": "corr con espacios" },
      payload
    });

    expect(response.statusCode).toBe(201);
    expect(response.headers["x-correlation-id"]).toMatch(UUID_PATTERN);
  });

  it("responde 404 uniforme para rutas inexistentes", async () => {
    const subject = createApp();
    current = await subject.build();

    const response = await current.inject({
      method: "GET",
      url: "/api/v1/no-existe",
      headers: { "x-correlation-id": "corr-http-404" }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        codigo: "RUTA_NO_ENCONTRADA",
        mensaje: "La ruta solicitada no existe.",
        correlationId: "corr-http-404"
      }
    });
    expect(response.headers["x-correlation-id"]).toBe("corr-http-404");
  });

  it("responde 405 uniforme y declara los métodos permitidos", async () => {
    const subject = createApp();
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/health",
      headers: { "x-correlation-id": "corr-http-405" }
    });

    expect(response.statusCode).toBe(405);
    expect(response.headers.allow).toBe("GET, HEAD");
    expect(response.json()).toEqual({
      error: {
        codigo: "METODO_NO_PERMITIDO",
        mensaje: "El método HTTP no está permitido para esta ruta.",
        correlationId: "corr-http-405"
      }
    });
  });

  it("aplica CORS solo a los orígenes configurados y responde preflight", async () => {
    const allowedOrigin = "http://localhost:5173";
    const subject = createApp(undefined, { CORS_ORIGINS: allowedOrigin });
    current = await subject.build();

    const simple = await current.inject({
      method: "GET",
      url: "/health",
      headers: { origin: allowedOrigin }
    });
    expect(simple.statusCode).toBe(200);
    expect(simple.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(simple.headers["access-control-expose-headers"]).toBe("x-correlation-id");

    const preflight = await current.inject({
      method: "OPTIONS",
      url: "/api/v1/buyers",
      headers: {
        origin: allowedOrigin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-correlation-id"
      }
    });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(preflight.headers["access-control-allow-methods"]).toBe(
      "GET, POST, OPTIONS"
    );
    expect(preflight.headers["access-control-allow-headers"]).toContain(
      "x-correlation-id"
    );

    const denied = await current.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://evil.example" }
    });
    expect(denied.statusCode).toBe(200);
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("devuelve 400 por cuerpo inválido sin persistir", async () => {
    const store = new MemoryBuyerRegistrationStore();
    const subject = createApp(store);
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: { "x-correlation-id": "corr-http-400" },
      payload: {
        ...payload,
        documentoIdentidad: { tipo: "CC", pais: "CO" }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        codigo: "VALIDACION_INVALIDA",
        correlationId: "corr-http-400"
      }
    });
    expect(store.getAuditRecords()).toHaveLength(0);
  });

  it("rechaza propiedades desconocidas en la raíz y en el documento", async () => {
    const subject = createApp();
    current = await subject.build();

    const rootResponse = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      payload: { ...payload, rol: "ADMINISTRADOR" }
    });
    const documentResponse = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      payload: {
        ...payload,
        documentoIdentidad: {
          ...payload.documentoIdentidad,
          expedidoEn: "2020-01-01"
        }
      }
    });

    expect(rootResponse.statusCode).toBe(400);
    expect(rootResponse.json().error.codigo).toBe("VALIDACION_INVALIDA");
    expect(documentResponse.statusCode).toBe(400);
    expect(documentResponse.json().error.codigo).toBe("VALIDACION_INVALIDA");
  });

  it("devuelve 400 por correo mal formado", async () => {
    const subject = createApp();
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      payload: { ...payload, correoElectronico: "ana@" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.codigo).toBe("VALIDACION_INVALIDA");
  });

  it("devuelve 400 por credencial fuera de la política 12–128", async () => {
    const subject = createApp();
    current = await subject.build();

    const shortResponse = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      payload: { ...payload, credencial: "corta" }
    });
    const longResponse = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      payload: { ...payload, credencial: "x".repeat(129) }
    });

    expect(shortResponse.statusCode).toBe(400);
    expect(shortResponse.json().error.codigo).toBe("VALIDACION_INVALIDA");
    expect(longResponse.statusCode).toBe(400);
    expect(longResponse.json().error.codigo).toBe("VALIDACION_INVALIDA");
  });

  it("devuelve 400 por JSON malformado", async () => {
    const subject = createApp();
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": "corr-http-json"
      },
      payload: "{"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        codigo: "VALIDACION_INVALIDA",
        correlationId: "corr-http-json"
      }
    });
  });

  it("devuelve 413 cuando el cuerpo excede el límite", async () => {
    const subject = createApp();
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: { "x-correlation-id": "corr-http-413" },
      payload: { ...payload, nombreCompleto: "a".repeat(70 * 1024) }
    });

    expect(response.statusCode).toBe(413);
    expect(response.json()).toMatchObject({
      error: {
        codigo: "VALIDACION_INVALIDA",
        correlationId: "corr-http-413"
      }
    });
  });

  it("devuelve 415 cuando el media type no es JSON", async () => {
    const subject = createApp();
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: {
        "content-type": "application/xml",
        "x-correlation-id": "corr-http-415"
      },
      payload: "texto"
    });

    expect(response.statusCode).toBe(415);
    expect(response.json()).toMatchObject({
      error: {
        codigo: "VALIDACION_INVALIDA",
        correlationId: "corr-http-415"
      }
    });
  });

  it("devuelve 409 por correo duplicado sin distinguir mayúsculas", async () => {
    const subject = createApp();
    current = await subject.build();
    await current.inject({ method: "POST", url: "/api/v1/buyers", payload });

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: { "x-correlation-id": "corr-http-409-email" },
      payload: {
        ...payload,
        correoElectronico: "ANA.PEREZ@example.com",
        documentoIdentidad: { tipo: "CC", pais: "CO", numero: "999999" }
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      error: {
        codigo: "CONFLICTO_UNICIDAD",
        correlationId: "corr-http-409-email"
      }
    });
  });

  it("devuelve 409 por documento duplicado", async () => {
    const subject = createApp();
    current = await subject.build();
    await current.inject({ method: "POST", url: "/api/v1/buyers", payload });

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      payload: {
        ...payload,
        correoElectronico: "otro@example.com"
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.codigo).toBe("CONFLICTO_UNICIDAD");
  });

  it("devuelve 503 si la persistencia falla durante la verificación", async () => {
    const subject = createApp(new FailingLookupStore());
    current = await subject.build();

    const response = await current.inject({
      method: "POST",
      url: "/api/v1/buyers",
      headers: { "x-correlation-id": "corr-http-503" },
      payload
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: {
        codigo: "DEPENDENCIA_NO_DISPONIBLE",
        mensaje: "Base de datos no disponible.",
        correlationId: "corr-http-503"
      }
    });
  });

  it("expone health y readiness con el contrato declarado", async () => {
    const subject = createApp();
    current = await subject.build();

    const health = await current.inject({ method: "GET", url: "/health" });
    const ready = await current.inject({ method: "GET", url: "/ready" });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({
      status: "ok",
      service: "nexusmarket-backend",
      version: "0.1.0"
    });
    expect(health.headers["x-correlation-id"]).toMatch(UUID_PATTERN);
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: "ready" });
    expect(ready.headers["x-correlation-id"]).toMatch(UUID_PATTERN);
  });

  it("devuelve 503 en readiness si la dependencia no responde", async () => {
    const subject = createApp(new FailingHealthStore());
    current = await subject.build();

    const response = await current.inject({
      method: "GET",
      url: "/ready",
      headers: { "x-correlation-id": "corr-ready-503" }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "not_ready" });
    expect(response.headers["x-correlation-id"]).toBe("corr-ready-503");
  });
});
