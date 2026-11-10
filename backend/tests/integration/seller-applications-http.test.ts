import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { SessionTokenGenerator } from "../../src/shared/application/ports.js";
import { hashSessionToken } from "../../src/shared/infrastructure/session-tokens.js";
import { auditId, eventId } from "../../src/shared/domain/ids.js";
import type { AdminUserDetail } from "../../src/modules/admin/application/ports.js";
import { FakeAdminStore } from "../support/fake-admin-store.js";
import { FakeBuyerRegistrationStore } from "../support/fake-buyer-registration-store.js";
import { FakeCatalogQueryRepository } from "../support/fake-catalog-query-repository.js";
import { FakeSellerApplicationStore } from "../support/fake-seller-application-store.js";
import { FakeUserAccessStore } from "../support/fake-user-access-store.js";
import { FakeIdentityStore, FakePasswordHasher } from "../support/fakes.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";

const PASSWORD = "NexusMarketDemo2026!";
const NOW = "2026-11-08T12:00:00.000Z";
const ADMIN_USER = "90000000-0000-4000-8000-0000000000ad";
const BUYER_USER = "90000000-0000-4000-8000-0000000000b1";
const BUYER_TWO_USER = "90000000-0000-4000-8000-0000000000b2";
const SELLER_USER = "90000000-0000-4000-8000-0000000000e1";
const LOGISTICS_USER = "90000000-0000-4000-8000-0000000000f1";
const BUYER_ID = "71000000-0000-4000-8000-000000000001";
const BUYER_TWO_ID = "71000000-0000-4000-8000-000000000002";
const SELLER_ID = "20000000-0000-4000-8000-000000000001";

class DeterministicTokens implements SessionTokenGenerator {
  private count = 0;

  generate(): { token: string; tokenHash: string } {
    this.count += 1;
    const token = `seller-application-token-${this.count}`;
    return { token, tokenHash: hashSessionToken(token) };
  }
}

const adminDetail: AdminUserDetail = {
  id: ADMIN_USER,
  nombreCompleto: "Administradora Demo",
  correoElectronico: "admin@nexusmarket.demo",
  rol: "ADMINISTRADOR",
  estado: "ACTIVO",
  creadoEn: NOW,
  actualizadoEn: NOW,
  perfilId: null,
  perfil: null
};

interface Harness {
  readonly app: FastifyInstance;
  readonly applications: FakeSellerApplicationStore;
  readonly access: FakeUserAccessStore;
}

async function createHarness(): Promise<Harness> {
  const identity = new FakeIdentityStore([
    {
      usuarioId: ADMIN_USER,
      nombreCompleto: "Administradora Demo",
      correoElectronico: "admin@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "ADMINISTRADOR",
      estado: "ACTIVO"
    },
    {
      usuarioId: BUYER_USER,
      nombreCompleto: "Compradora Demo",
      correoElectronico: "compradora@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "COMPRADOR",
      estado: "ACTIVO",
      compradorId: BUYER_ID
    },
    {
      usuarioId: BUYER_TWO_USER,
      nombreCompleto: "Comprador Dos",
      correoElectronico: "comprador.dos@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "COMPRADOR",
      estado: "ACTIVO",
      compradorId: BUYER_TWO_ID
    },
    {
      usuarioId: SELLER_USER,
      nombreCompleto: "Aurora Vendedora",
      correoElectronico: "aurora@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "VENDEDOR",
      estado: "ACTIVO",
      sellerId: SELLER_ID
    },
    {
      usuarioId: LOGISTICS_USER,
      nombreCompleto: "Operador Logístico",
      correoElectronico: "logistica@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "OPERADOR_LOGISTICO",
      estado: "ACTIVO"
    }
  ]);

  const applications = new FakeSellerApplicationStore();
  for (const user of [
    {
      usuarioId: BUYER_USER,
      nombreCompleto: "Compradora Demo",
      correoElectronico: "compradora@nexusmarket.demo",
      rol: "COMPRADOR" as const,
      estado: "ACTIVO" as const
    },
    {
      usuarioId: BUYER_TWO_USER,
      nombreCompleto: "Comprador Dos",
      correoElectronico: "comprador.dos@nexusmarket.demo",
      rol: "COMPRADOR" as const,
      estado: "ACTIVO" as const
    },
    {
      usuarioId: ADMIN_USER,
      nombreCompleto: "Administradora Demo",
      correoElectronico: "admin@nexusmarket.demo",
      rol: "ADMINISTRADOR" as const,
      estado: "ACTIVO" as const
    }
  ]) {
    applications.seedUser(user);
  }

  const access = new FakeUserAccessStore();
  access.seedUser({
    usuarioId: BUYER_USER,
    rol: "COMPRADOR",
    estado: "ACTIVO",
    actualizadoEn: NOW
  });
  access.seedUser({
    usuarioId: ADMIN_USER,
    rol: "ADMINISTRADOR",
    estado: "ACTIVO",
    actualizadoEn: NOW
  });

  const adminStore = new FakeAdminStore();
  adminStore.seedUser(adminDetail);

  const app = await buildApp(
    loadConfig({
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: "3000",
      DATABASE_URL:
        "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test",
      LOG_LEVEL: "silent"
    }),
    {
      store: new FakeBuyerRegistrationStore(),
      catalog: new FakeCatalogQueryRepository(),
      hasher: new FakePasswordHasher(),
      clock: new FixedClock(NOW),
      ids: new SequentialIds(),
      identity,
      sessionTokens: new DeterministicTokens(),
      sellerApplications: applications,
      userAccess: access,
      admin: adminStore
    }
  );

  return { app, applications, access };
}

function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

async function login(app: FastifyInstance, email: string): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { correoElectronico: email, credencial: PASSWORD }
  });
  expect(response.statusCode).toBe(200);
  return response.json().data.token;
}

const applicationPayload = {
  nombreComercial: "Estudio Nueva",
  nombreBodega: "Bodega Principal",
  ubicacionBodega: "Bogotá, Colombia"
};

describe("HTTP de solicitudes de vendedor y estado de acceso", () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("exige autenticación en las rutas de solicitud y de administración", async () => {
    const anonymous = await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyer/seller-application",
      payload: applicationPayload
    });
    expect(anonymous.statusCode).toBe(401);

    const anonymousOwn = await harness.app.inject({
      method: "GET",
      url: "/api/v1/buyer/seller-application"
    });
    expect(anonymousOwn.statusCode).toBe(401);

    const anonymousList = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/seller-applications"
    });
    expect(anonymousList.statusCode).toBe(401);
  });

  it("registra y consulta la solicitud propia sin cambiar el rol ni el estado", async () => {
    const token = await login(harness.app, "compradora@nexusmarket.demo");
    const headers = bearer(token);

    const created = await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyer/seller-application",
      headers,
      payload: applicationPayload
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data).toMatchObject({
      usuarioId: BUYER_USER,
      nombreComercial: "Estudio Nueva",
      estado: "PENDIENTE",
      usuarioRol: "COMPRADOR",
      usuarioEstado: "ACTIVO",
      sellerId: null,
      warehouseId: null
    });

    const own = await harness.app.inject({
      method: "GET",
      url: "/api/v1/buyer/seller-application",
      headers
    });
    expect(own.statusCode).toBe(200);
    expect(own.json().data.solicitud).toMatchObject({
      id: created.json().data.id,
      estado: "PENDIENTE"
    });
    expect(harness.applications.countByEstado("PENDIENTE")).toBe(1);
  });

  it("rechaza una segunda solicitud pendiente y no acepta rol desde el cliente", async () => {
    const token = await login(harness.app, "compradora@nexusmarket.demo");
    const headers = bearer(token);

    await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyer/seller-application",
      headers,
      payload: applicationPayload
    });

    const duplicate = await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyer/seller-application",
      headers,
      payload: applicationPayload
    });
    expect(duplicate.statusCode).toBe(422);
    expect(duplicate.json().error.codigo).toBe("REGLA_NEGOCIO_INCUMPLIDA");

    const withRole = await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyer/seller-application",
      headers,
      payload: { ...applicationPayload, rol: "VENDEDOR" }
    });
    expect(withRole.statusCode).toBe(400);
    expect(harness.applications.countByEstado("PENDIENTE")).toBe(1);
  });

  it("solo permite solicitar a una cuenta compradora activa", async () => {
    for (const email of [
      "aurora@nexusmarket.demo",
      "logistica@nexusmarket.demo",
      "admin@nexusmarket.demo"
    ]) {
      const token = await login(harness.app, email);
      const response = await harness.app.inject({
        method: "POST",
        url: "/api/v1/buyer/seller-application",
        headers: bearer(token),
        payload: applicationPayload
      });
      expect(response.statusCode, email).toBe(403);
      expect(response.json().error.codigo).toBe("NO_AUTORIZADO");
    }
    expect(harness.applications.countByEstado("PENDIENTE")).toBe(0);
  });

  it("permite al administrador listar, consultar, aprobar y reintentar sin duplicar", async () => {
    const buyerToken = await login(harness.app, "compradora@nexusmarket.demo");
    const created = await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyer/seller-application",
      headers: bearer(buyerToken),
      payload: applicationPayload
    });
    const applicationId = created.json().data.id;

    const adminToken = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(adminToken);

    const list = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/seller-applications?estado=PENDIENTE&search=Estudio",
      headers
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().data).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 20
    });
    expect(list.json().data.items[0]).toMatchObject({ id: applicationId });

    const detail = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/seller-applications/${applicationId}`,
      headers
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().data).toMatchObject({
      id: applicationId,
      ubicacionBodega: "Bogotá, Colombia",
      estado: "PENDIENTE"
    });

    const approved = await harness.app.inject({
      method: "POST",
      url: `/api/v1/admin/seller-applications/${applicationId}/approve`,
      headers
    });
    expect(approved.statusCode).toBe(200);
    expect(approved.json().data).toMatchObject({
      yaAprobada: false,
      solicitud: { estado: "APROBADA", usuarioRol: "VENDEDOR" }
    });
    const sellerId = approved.json().data.sellerId;
    const warehouseId = approved.json().data.warehouseId;
    expect(sellerId).toBeTruthy();
    expect(warehouseId).toBeTruthy();
    expect(harness.applications.countByEstado("APROBADA")).toBe(1);

    const retry = await harness.app.inject({
      method: "POST",
      url: `/api/v1/admin/seller-applications/${applicationId}/approve`,
      headers
    });
    expect(retry.statusCode).toBe(200);
    expect(retry.json().data).toMatchObject({
      yaAprobada: true,
      sellerId,
      warehouseId
    });
    expect(harness.applications.countByEstado("APROBADA")).toBe(1);
  });

  it("el rechazo no crea vendedor ni bodega y bloquea una aprobación posterior", async () => {
    const buyerToken = await login(harness.app, "compradora@nexusmarket.demo");
    const created = await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyer/seller-application",
      headers: bearer(buyerToken),
      payload: applicationPayload
    });
    const applicationId = created.json().data.id;

    const adminToken = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(adminToken);

    const rejected = await harness.app.inject({
      method: "POST",
      url: `/api/v1/admin/seller-applications/${applicationId}/reject`,
      headers,
      payload: { motivo: "Información comercial incompleta" }
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json().data).toMatchObject({
      estado: "RECHAZADA",
      motivoRechazo: "Información comercial incompleta",
      sellerId: null,
      warehouseId: null,
      usuarioRol: "COMPRADOR"
    });
    expect(harness.applications.countByEstado("APROBADA")).toBe(0);

    const approveAfterReject = await harness.app.inject({
      method: "POST",
      url: `/api/v1/admin/seller-applications/${applicationId}/approve`,
      headers
    });
    expect(approveAfterReject.statusCode).toBe(422);
    expect(approveAfterReject.json().error.codigo).toBe(
      "REGLA_NEGOCIO_INCUMPLIDA"
    );

    const missingReason = await harness.app.inject({
      method: "POST",
      url: `/api/v1/admin/seller-applications/${applicationId}/reject`,
      headers,
      payload: {}
    });
    expect(missingReason.statusCode).toBe(400);
  });

  it("no permite que el administrador apruebe ni rechace su propia solicitud", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const application = await harness.applications.create({
      id: "00000000-0000-4000-8025-000000000001",
      usuarioId: ADMIN_USER,
      nombreComercial: "Propia",
      nombreBodega: "Bodega propia",
      ubicacionBodega: "Bogotá",
      creadaEn: NOW,
      actualizadaEn: NOW,
      auditoria: {
        id: auditId("00000000-0000-4000-8001-000000000001"),
        evento: "seller-application.submitted.v1",
        recursoTipo: "SolicitudVendedor",
        recursoId: "00000000-0000-4000-8025-000000000001",
        actorId: ADMIN_USER,
        rolActor: "ADMINISTRADOR",
        ocurridoEn: { value: NOW } as never,
        correlationId: "seed",
        resultado: "EXITO",
        gravedad: "INFORMACION",
        detalles: {}
      },
      evento: {
        id: eventId("00000000-0000-4000-8002-000000000001"),
        tipo: "seller.application.submitted",
        versionEsquema: 1,
        agregadoTipo: "SolicitudVendedor",
        agregadoId: "00000000-0000-4000-8025-000000000001",
        ocurridoEn: { value: NOW } as never,
        correlationId: "seed",
        payload: {}
      }
    });

    const headers = bearer(token);
    const approve = await harness.app.inject({
      method: "POST",
      url: `/api/v1/admin/seller-applications/${application.id}/approve`,
      headers
    });
    expect(approve.statusCode).toBe(403);

    const reject = await harness.app.inject({
      method: "POST",
      url: `/api/v1/admin/seller-applications/${application.id}/reject`,
      headers,
      payload: { motivo: "Intento propio" }
    });
    expect(reject.statusCode).toBe(403);
  });

  it("cambia el estado de acceso y revoca las sesiones vigentes", async () => {
    harness.access.sesionesVigentes = 2;
    const adminToken = await login(harness.app, "admin@nexusmarket.demo");

    const response = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${BUYER_USER}/access-status`,
      headers: bearer(adminToken),
      payload: { accion: "DESACTIVAR", motivo: "Solicitud del titular" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      usuarioId: BUYER_USER,
      estadoAnterior: "ACTIVO",
      estadoNuevo: "INACTIVO",
      sesionesRevocadas: 2
    });
    expect(harness.access.getUser(BUYER_USER)?.estado).toBe("INACTIVO");
  });

  it("rechaza transiciones inválidas, motivos faltantes y autogestión", async () => {
    const adminToken = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(adminToken);

    const invalid = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${BUYER_USER}/access-status`,
      headers,
      payload: { accion: "ACTIVAR" }
    });
    expect(invalid.statusCode).toBe(422);
    expect(invalid.json().error.detalles).toMatchObject({
      transicionInvalida: true,
      estadoActual: "ACTIVO"
    });

    const missingReason = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${BUYER_USER}/access-status`,
      headers,
      payload: { accion: "BLOQUEAR" }
    });
    expect(missingReason.statusCode).toBe(400);

    const self = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${ADMIN_USER}/access-status`,
      headers,
      payload: { accion: "DESACTIVAR", motivo: "Auto" }
    });
    expect(self.statusCode).toBe(403);
    expect(self.json().error.codigo).toBe("NO_AUTORIZADO");
  });

  it("no permite que otros roles cambien el estado de acceso", async () => {
    const token = await login(harness.app, "compradora@nexusmarket.demo");
    const response = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${BUYER_USER}/access-status`,
      headers: bearer(token),
      payload: { accion: "DESACTIVAR", motivo: "No autorizado" }
    });
    expect(response.statusCode).toBe(403);
    expect(harness.access.getUser(BUYER_USER)?.estado).toBe("ACTIVO");
  });

  it("responde 405 en métodos no permitidos de administración", async () => {
    const adminToken = await login(harness.app, "admin@nexusmarket.demo");
    const response = await harness.app.inject({
      method: "PUT",
      url: `/api/v1/admin/users/${BUYER_USER}/access-status`,
      headers: bearer(adminToken),
      payload: { accion: "ACTIVAR" }
    });
    expect(response.statusCode).toBe(405);
    expect(response.json().error.codigo).toBe("METODO_NO_PERMITIDO");
  });
});
