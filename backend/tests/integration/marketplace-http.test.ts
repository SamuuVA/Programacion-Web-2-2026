import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { SessionTokenGenerator } from "../../src/shared/application/ports.js";
import { hashSessionToken } from "../../src/shared/infrastructure/session-tokens.js";
import type {
  OrderDetail,
  OrderSummary
} from "../../src/modules/orders/application/ports.js";
import { FakeCatalogQueryRepository } from "../support/fake-catalog-query-repository.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import {
  FakeAddressStore,
  FakeCartStore,
  FakeCheckoutStore,
  FakeIdentityStore,
  FakePasswordHasher,
  FakeSellerRegistrationStore
} from "../support/fakes.js";
import { FakeBuyerRegistrationStore } from "../support/fake-buyer-registration-store.js";

const PASSWORD = "NexusMarketDemo2026!";
const ADMIN_ID = "00000000-0000-4000-8000-0000000000ad";
const BUYER_A_ID = "00000000-0000-4000-8000-0000000000a1";
const BUYER_B_ID = "00000000-0000-4000-8000-0000000000b1";
const SELLER_USER_ID = "00000000-0000-4000-8000-0000000000c1";
const INACTIVE_ID = "00000000-0000-4000-8000-0000000000d1";
const BUYER_A_PROFILE = "00000000-0000-4000-8001-000000000001";
const BUYER_B_PROFILE = "00000000-0000-4000-8001-000000000002";
const SELLER_PROFILE = "00000000-0000-4000-8006-000000000001";

const PHYSICAL_ID = "40000000-0000-4000-8000-000000000001";
const SUSPENDED_ID = "40000000-0000-4000-8000-000000000002";
const DIGITAL_ID = "40000000-0000-4000-8000-000000000003";

class DeterministicTokens implements SessionTokenGenerator {
  private count = 0;

  generate(): { token: string; tokenHash: string } {
    this.count += 1;
    const token = `market-token-${this.count}`;
    return { token, tokenHash: hashSessionToken(token) };
  }
}

function product(productoId: string, overrides: Record<string, unknown> = {}) {
  return {
    productoId,
    nombre: "Audífonos Aurora",
    sku: "AUR-AUD-001",
    categoria: "ELECTRONICA" as const,
    tipoEntrega: "FISICA" as const,
    precioCentavos: 42990000,
    moneda: "COP",
    estadoProducto: "PUBLICADO" as const,
    vendedorId: SELLER_PROFILE,
    vendedorNombre: "Estudio Aurora",
    estadoVendedor: "ACTIVO" as const,
    disponible: 5,
    ...overrides
  };
}

function addressPayload(overrides: Record<string, unknown> = {}) {
  return {
    destinatario: "Compradora Demo",
    telefono: "+57 300 000 0000",
    linea1: "Calle 1 # 2-3",
    ciudad: "Bogotá",
    region: "Cundinamarca",
    ...overrides
  };
}

interface Harness {
  readonly app: FastifyInstance;
  readonly identity: FakeIdentityStore;
  readonly addresses: FakeAddressStore;
  readonly sellers: FakeSellerRegistrationStore;
  readonly cart: FakeCartStore;
  readonly checkout: FakeCheckoutStore;
}

async function createHarness(): Promise<Harness> {
  const identity = new FakeIdentityStore([
    {
      usuarioId: ADMIN_ID,
      nombreCompleto: "Administradora Nexus",
      correoElectronico: "admin@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "ADMINISTRADOR",
      estado: "ACTIVO"
    },
    {
      usuarioId: BUYER_A_ID,
      nombreCompleto: "Compradora A",
      correoElectronico: "compradora.a@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "COMPRADOR",
      estado: "ACTIVO",
      compradorId: BUYER_A_PROFILE
    },
    {
      usuarioId: BUYER_B_ID,
      nombreCompleto: "Compradora B",
      correoElectronico: "compradora.b@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "COMPRADOR",
      estado: "ACTIVO",
      compradorId: BUYER_B_PROFILE
    },
    {
      usuarioId: SELLER_USER_ID,
      nombreCompleto: "Vendedor Demo",
      correoElectronico: "vendedor@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "VENDEDOR",
      estado: "ACTIVO",
      sellerId: SELLER_PROFILE
    },
    {
      usuarioId: INACTIVE_ID,
      nombreCompleto: "Cuenta Inactiva",
      correoElectronico: "inactiva@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "COMPRADOR",
      estado: "INACTIVO",
      compradorId: "00000000-0000-4000-8001-000000000009"
    }
  ]);
  const addresses = new FakeAddressStore();
  const sellers = new FakeSellerRegistrationStore();
  const cart = new FakeCartStore([
    product(PHYSICAL_ID),
    product(SUSPENDED_ID, {
      nombre: "Producto Suspendido",
      estadoProducto: "SUSPENDIDO"
    }),
    product(DIGITAL_ID, {
      nombre: "Guía Digital",
      categoria: "DIGITAL",
      tipoEntrega: "DIGITAL",
      disponible: null
    })
  ]);
  const checkout = new FakeCheckoutStore();

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
      clock: new FixedClock(),
      ids: new SequentialIds(),
      identity,
      sessionTokens: new DeterministicTokens(),
      addresses,
      sellers,
      cart,
      checkout
    }
  );

  return { app, identity, addresses, sellers, cart, checkout };
}

function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

async function login(
  app: FastifyInstance,
  correoElectronico: string
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { correoElectronico, credencial: PASSWORD }
  });
  expect(response.statusCode).toBe(200);
  return response.json().data.token;
}

describe("HTTP del marketplace: autenticación y autorización", () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("inicia sesión, expone la cookie y resuelve la sesión con Bearer", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        correoElectronico: "COMPRADORA.A@nexusmarket.demo",
        credencial: PASSWORD
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.usuario).toMatchObject({
      usuarioId: BUYER_A_ID,
      rol: "COMPRADOR",
      compradorId: BUYER_A_PROFILE
    });
    const cookie = response.headers["set-cookie"];
    expect(String(cookie)).toContain("nexus_session=");
    expect(String(cookie)).toContain("HttpOnly");
    expect(String(cookie)).toContain("SameSite=Lax");

    const token = response.json().data.token;
    const session = await harness.app.inject({
      method: "GET",
      url: "/api/v1/auth/session",
      headers: bearer(token)
    });
    expect(session.statusCode).toBe(200);
    expect(session.json().data.usuario.rol).toBe("COMPRADOR");
  });

  it("rechaza credenciales incorrectas y cuentas inactivas sin distinguirlas", async () => {
    for (const payload of [
      {
        correoElectronico: "compradora.a@nexusmarket.demo",
        credencial: "mala"
      },
      { correoElectronico: "nadie@nexusmarket.demo", credencial: PASSWORD },
      { correoElectronico: "inactiva@nexusmarket.demo", credencial: PASSWORD }
    ]) {
      const response = await harness.app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().error).toMatchObject({
        codigo: "NO_AUTENTICADO",
        mensaje: "Correo o contraseña incorrectos."
      });
    }
  });

  it("revoca la sesión al cerrar sesión", async () => {
    const token = await login(harness.app, "compradora.a@nexusmarket.demo");

    const logout = await harness.app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: bearer(token)
    });
    expect(logout.statusCode).toBe(204);

    const session = await harness.app.inject({
      method: "GET",
      url: "/api/v1/auth/session",
      headers: bearer(token)
    });
    expect(session.statusCode).toBe(401);
    expect(session.json().error.codigo).toBe("NO_AUTENTICADO");
  });

  it("protege los puertos por rol y por sesión", async () => {
    const buyer = await login(harness.app, "compradora.a@nexusmarket.demo");
    const seller = await login(harness.app, "vendedor@nexusmarket.demo");
    const admin = await login(harness.app, "admin@nexusmarket.demo");

    const anonymous = await harness.app.inject({
      method: "GET",
      url: "/api/v1/cart"
    });
    expect(anonymous.statusCode).toBe(401);

    const buyerAsAdmin = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/sellers",
      headers: bearer(buyer),
      payload: {}
    });
    expect(buyerAsAdmin.statusCode).toBe(403);

    for (const token of [seller, admin]) {
      const response = await harness.app.inject({
        method: "GET",
        url: "/api/v1/cart",
        headers: bearer(token)
      });
      expect(response.statusCode).toBe(403);
      expect(response.json().error.codigo).toBe("NO_AUTORIZADO");
    }
  });

  it("permite consultar la sesión usando la cookie emitida", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        correoElectronico: "compradora.a@nexusmarket.demo",
        credencial: PASSWORD
      }
    });
    const cookie = String(response.headers["set-cookie"]).split(";")[0];

    const session = await harness.app.inject({
      method: "GET",
      url: "/api/v1/auth/session",
      headers: { cookie: cookie! }
    });
    expect(session.statusCode).toBe(200);
  });
});

describe("HTTP del marketplace: direcciones L-01", () => {
  let harness: Harness;
  let token: string;

  beforeEach(async () => {
    harness = await createHarness();
    token = await login(harness.app, "compradora.a@nexusmarket.demo");
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("crea la primera dirección como principal y respeta el orden", async () => {
    const first = await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyers/me/addresses",
      headers: bearer(token),
      payload: addressPayload()
    });
    expect(first.statusCode).toBe(201);
    expect(first.json().data.esPrincipal).toBe(true);

    const second = await harness.app.inject({
      method: "POST",
      url: "/api/v1/buyers/me/addresses",
      headers: bearer(token),
      payload: addressPayload({ linea1: "Carrera 9 # 10-11" })
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().data.esPrincipal).toBe(false);

    const list = await harness.app.inject({
      method: "GET",
      url: "/api/v1/buyers/me/addresses",
      headers: bearer(token)
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().data).toHaveLength(2);
    expect(list.json().data[0].esPrincipal).toBe(true);
  });

  it("marca una dirección como principal y promueve la más antigua al borrarla", async () => {
    const first = (
      await harness.app.inject({
        method: "POST",
        url: "/api/v1/buyers/me/addresses",
        headers: bearer(token),
        payload: addressPayload()
      })
    ).json().data;
    const second = (
      await harness.app.inject({
        method: "POST",
        url: "/api/v1/buyers/me/addresses",
        headers: bearer(token),
        payload: addressPayload({ linea1: "Carrera 9 # 10-11" })
      })
    ).json().data;

    const setPrincipal = await harness.app.inject({
      method: "POST",
      url: `/api/v1/buyers/me/addresses/${second.id}/principal`,
      headers: bearer(token)
    });
    expect(setPrincipal.statusCode).toBe(204);

    const afterSet = (
      await harness.app.inject({
        method: "GET",
        url: "/api/v1/buyers/me/addresses",
        headers: bearer(token)
      })
    ).json().data;
    expect(afterSet[0]).toMatchObject({ id: second.id, esPrincipal: true });
    expect(afterSet[1]).toMatchObject({ id: first.id, esPrincipal: false });

    const deleted = await harness.app.inject({
      method: "DELETE",
      url: `/api/v1/buyers/me/addresses/${second.id}`,
      headers: bearer(token)
    });
    expect(deleted.statusCode).toBe(204);

    const afterDelete = (
      await harness.app.inject({
        method: "GET",
        url: "/api/v1/buyers/me/addresses",
        headers: bearer(token)
      })
    ).json().data;
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0]).toMatchObject({ id: first.id, esPrincipal: true });
  });

  it("actualiza solo los campos enviados y rechaza cuerpos inválidos", async () => {
    const created = (
      await harness.app.inject({
        method: "POST",
        url: "/api/v1/buyers/me/addresses",
        headers: bearer(token),
        payload: addressPayload()
      })
    ).json().data;

    const updated = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/buyers/me/addresses/${created.id}`,
      headers: bearer(token),
      payload: { ciudad: "Medellín" }
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data).toMatchObject({
      ciudad: "Medellín",
      linea1: "Calle 1 # 2-3"
    });

    for (const payload of [{}, { esPrincipal: true }, { pais: "COL" }]) {
      const invalid = await harness.app.inject({
        method: "PATCH",
        url: `/api/v1/buyers/me/addresses/${created.id}`,
        headers: bearer(token),
        payload
      });
      expect(invalid.statusCode).toBe(400);
    }
  });

  it("no permite leer ni modificar direcciones de otro comprador", async () => {
    const created = (
      await harness.app.inject({
        method: "POST",
        url: "/api/v1/buyers/me/addresses",
        headers: bearer(token),
        payload: addressPayload()
      })
    ).json().data;
    const other = await login(harness.app, "compradora.b@nexusmarket.demo");

    const list = await harness.app.inject({
      method: "GET",
      url: "/api/v1/buyers/me/addresses",
      headers: bearer(other)
    });
    expect(list.json().data).toEqual([]);

    for (const request of [
      {
        method: "PATCH" as const,
        url: `/api/v1/buyers/me/addresses/${created.id}`,
        payload: { ciudad: "Cali" }
      },
      {
        method: "DELETE" as const,
        url: `/api/v1/buyers/me/addresses/${created.id}`
      },
      {
        method: "POST" as const,
        url: `/api/v1/buyers/me/addresses/${created.id}/principal`
      }
    ]) {
      const response = await harness.app.inject({
        ...request,
        headers: bearer(other)
      });
      expect(response.statusCode).toBe(404);
    }
  });

  it("exige autenticación de comprador", async () => {
    const anonymous = await harness.app.inject({
      method: "GET",
      url: "/api/v1/buyers/me/addresses"
    });
    expect(anonymous.statusCode).toBe(401);

    const seller = await login(harness.app, "vendedor@nexusmarket.demo");
    const forbidden = await harness.app.inject({
      method: "GET",
      url: "/api/v1/buyers/me/addresses",
      headers: bearer(seller)
    });
    expect(forbidden.statusCode).toBe(403);
  });
});

describe("HTTP del marketplace: carrito", () => {
  let harness: Harness;
  let token: string;

  beforeEach(async () => {
    harness = await createHarness();
    token = await login(harness.app, "compradora.a@nexusmarket.demo");
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("agrega, consulta, actualiza y quita líneas", async () => {
    const added = await harness.app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: bearer(token),
      payload: { productoId: PHYSICAL_ID, cantidad: 2 }
    });
    expect(added.statusCode).toBe(200);
    expect(added.json().data.items[0]).toMatchObject({
      productoId: PHYSICAL_ID,
      cantidad: 2,
      subtotalCentavos: 42990000 * 2
    });

    const fetched = await harness.app.inject({
      method: "GET",
      url: "/api/v1/cart",
      headers: bearer(token)
    });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().data.items).toHaveLength(1);

    const updated = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/cart/items/${PHYSICAL_ID}`,
      headers: bearer(token),
      payload: { cantidad: 4 }
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.items[0].cantidad).toBe(4);

    const removed = await harness.app.inject({
      method: "DELETE",
      url: `/api/v1/cart/items/${PHYSICAL_ID}`,
      headers: bearer(token)
    });
    expect(removed.statusCode).toBe(200);
    expect(removed.json().data.items).toEqual([]);
  });

  it("rechaza cantidades inválidas, productos inexistentes o no vendibles", async () => {
    const invalidQuantity = await harness.app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: bearer(token),
      payload: { productoId: PHYSICAL_ID, cantidad: 0 }
    });
    expect(invalidQuantity.statusCode).toBe(400);

    const unknown = await harness.app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: bearer(token),
      payload: {
        productoId: "99999999-9999-4999-8999-999999999999",
        cantidad: 1
      }
    });
    expect(unknown.statusCode).toBe(404);

    const suspended = await harness.app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: bearer(token),
      payload: { productoId: SUSPENDED_ID, cantidad: 1 }
    });
    expect(suspended.statusCode).toBe(422);
    expect(suspended.json().error.detalles.motivo).toBe(
      "PRODUCTO_NO_PUBLICADO"
    );

    const overStock = await harness.app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: bearer(token),
      payload: { productoId: PHYSICAL_ID, cantidad: 6 }
    });
    expect(overStock.statusCode).toBe(422);
    expect(overStock.json().error.detalles.motivo).toBe("STOCK_INSUFICIENTE");

    const strict = await harness.app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: bearer(token),
      payload: { productoId: PHYSICAL_ID, cantidad: 1, precio: 1 }
    });
    expect(strict.statusCode).toBe(400);
  });

  it("acepta productos digitales sin stock físico", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: bearer(token),
      payload: { productoId: DIGITAL_ID, cantidad: 999 }
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.items[0]).toMatchObject({
      disponible: null,
      cantidad: 999,
      vendible: true
    });
  });
});

describe("HTTP del marketplace: checkout y pedidos", () => {
  let harness: Harness;
  let token: string;

  const summary: OrderSummary = {
    id: "00000000-0000-4000-8010-000000000001",
    numero: "NM-20261101-ABCDEF01",
    vendedorId: SELLER_PROFILE,
    vendedorNombre: "Estudio Aurora",
    estado: "EN_PREPARACION",
    estadoPago: "CAPTURADO",
    moneda: "COP",
    totalCentavos: 42990000,
    itemsCount: 1,
    creadoEn: "2026-11-01T12:00:00.000Z"
  };
  const detail: OrderDetail = {
    ...summary,
    items: [
      {
        id: "00000000-0000-4000-8011-000000000001",
        productoId: PHYSICAL_ID,
        nombreProducto: "Audífonos Aurora",
        sku: "AUR-AUD-001",
        tipoEntrega: "FISICA",
        cantidad: 1,
        precioUnitarioCentavos: 42990000,
        moneda: "COP",
        subtotalCentavos: 42990000
      }
    ],
    pago: {
      id: "00000000-0000-4000-8012-000000000001",
      estado: "CAPTURADO",
      proveedor: "SIMULADO",
      referencia: "SIM-NM-20261101-ABCDEF01",
      montoCentavos: 42990000,
      moneda: "COP"
    },
    direccionEntrega: null
  };

  beforeEach(async () => {
    harness = await createHarness();
    token = await login(harness.app, "compradora.a@nexusmarket.demo");
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("devuelve 201 para pago confirmado o rechazado y 202 para desconocido", async () => {
    const cases = [
      { outcome: "CONFIRMADO", status: 201 },
      { outcome: "RECHAZADO", status: 201 },
      { outcome: "DESCONOCIDO", status: 202 }
    ] as const;

    for (const { outcome, status } of cases) {
      const response = await harness.app.inject({
        method: "POST",
        url: "/api/v1/checkout",
        headers: bearer(token),
        payload: {
          idempotencyKey: `idem-${outcome}`,
          resultadoPagoSimulado: outcome
        }
      });
      expect(response.statusCode).toBe(status);
      expect(response.json().data.estado).toBe(outcome);
    }

    expect(harness.checkout.commands).toHaveLength(3);
  });

  it("valida clave de idempotencia, dirección y cuerpo estricto", async () => {
    const invalid = [
      { idempotencyKey: "" },
      { idempotencyKey: "ok", direccionEntregaId: "no-es-uuid" },
      { idempotencyKey: "ok", resultadoPagoSimulado: "TAL_VEZ" },
      { idempotencyKey: "ok", totalCentavos: 1 }
    ];

    for (const payload of invalid) {
      const response = await harness.app.inject({
        method: "POST",
        url: "/api/v1/checkout",
        headers: bearer(token),
        payload
      });
      expect(response.statusCode).toBe(400);
    }
  });

  it("lista y consulta pedidos propios, incluido el 404 ajeno", async () => {
    harness.checkout.listOrders = async () => [summary];
    harness.checkout.findOrder = async (_compradorId, orderId) =>
      orderId === detail.id ? detail : null;

    const list = await harness.app.inject({
      method: "GET",
      url: "/api/v1/orders",
      headers: bearer(token)
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().data).toEqual([summary]);

    const found = await harness.app.inject({
      method: "GET",
      url: `/api/v1/orders/${detail.id}`,
      headers: bearer(token)
    });
    expect(found.statusCode).toBe(200);
    expect(found.json().data).toMatchObject({
      id: detail.id,
      pago: { estado: "CAPTURADO" }
    });

    const missing = await harness.app.inject({
      method: "GET",
      url: "/api/v1/orders/00000000-0000-4000-8010-000000000099",
      headers: bearer(token)
    });
    expect(missing.statusCode).toBe(404);
  });

  it("exige un comprador autenticado", async () => {
    const anonymous = await harness.app.inject({
      method: "POST",
      url: "/api/v1/checkout",
      payload: { idempotencyKey: "idem-anon" }
    });
    expect(anonymous.statusCode).toBe(401);

    const seller = await login(harness.app, "vendedor@nexusmarket.demo");
    const forbidden = await harness.app.inject({
      method: "POST",
      url: "/api/v1/checkout",
      headers: bearer(seller),
      payload: { idempotencyKey: "idem-seller" }
    });
    expect(forbidden.statusCode).toBe(403);
  });
});

describe("HTTP del marketplace: alta administrativa de vendedor", () => {
  let harness: Harness;
  let adminToken: string;

  function sellerPayload(overrides: Record<string, unknown> = {}) {
    return {
      nombreCompleto: "Vendedor Nuevo",
      correoElectronico: "nuevo.vendedor@nexusmarket.demo",
      documentoIdentidad: {
        tipo: "CC",
        pais: "CO",
        numero: "900123456"
      },
      credencial: PASSWORD,
      nombreComercial: "Estudio Nuevo",
      bodega: {
        nombre: "Bodega Principal",
        ubicacion: "Bogotá, Colombia"
      },
      ...overrides
    };
  }

  beforeEach(async () => {
    harness = await createHarness();
    adminToken = await login(harness.app, "admin@nexusmarket.demo");
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("crea vendedor y bodega y rechaza el correo duplicado", async () => {
    const created = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/sellers",
      headers: bearer(adminToken),
      payload: sellerPayload()
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data).toMatchObject({
      estadoUsuario: "ACTIVO",
      estadoVendedor: "ACTIVO",
      estadoBodega: "ACTIVA"
    });
    expect(harness.sellers.getUserCount()).toBe(1);

    const duplicate = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/sellers",
      headers: bearer(adminToken),
      payload: sellerPayload({
        documentoIdentidad: { tipo: "CC", pais: "CO", numero: "OTRO-999" }
      })
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.codigo).toBe("CONFLICTO_UNICIDAD");
  });

  it("rechaza a un comprador y valida el cuerpo", async () => {
    const buyer = await login(harness.app, "compradora.a@nexusmarket.demo");
    const forbidden = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/sellers",
      headers: bearer(buyer),
      payload: sellerPayload()
    });
    expect(forbidden.statusCode).toBe(403);

    const invalid = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/sellers",
      headers: bearer(adminToken),
      payload: sellerPayload({ credencial: "corta" })
    });
    expect(invalid.statusCode).toBe(400);

    const anonymous = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/sellers",
      payload: sellerPayload()
    });
    expect(anonymous.statusCode).toBe(401);
  });
});
