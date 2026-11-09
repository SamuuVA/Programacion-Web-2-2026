import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { SessionTokenGenerator } from "../../src/shared/application/ports.js";
import { hashSessionToken } from "../../src/shared/infrastructure/session-tokens.js";
import type {
  SellerOrderDetail,
  SellerProductView,
  SellerProfileView,
  SellerWarehouseView
} from "../../src/modules/seller-workspace/application/ports.js";
import { FakeCatalogQueryRepository } from "../support/fake-catalog-query-repository.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import {
  FakeAddressStore,
  FakeIdentityStore,
  FakePasswordHasher
} from "../support/fakes.js";
import { FakeBuyerRegistrationStore } from "../support/fake-buyer-registration-store.js";
import { FakeSellerWorkspaceStore } from "../support/fake-seller-workspace-store.js";

const PASSWORD = "NexusMarketDemo2026!";
const NOW = "2026-11-03T12:00:00.000Z";

const ADMIN_USER = "00000000-0000-4000-8000-0000000000ad";
const BUYER_USER = "00000000-0000-4000-8000-0000000000b1";
const BUYER_PROFILE = "00000000-0000-4000-8001-000000000001";
const SELLER_A_USER = "00000000-0000-4000-8000-0000000000a1";
const SELLER_B_USER = "00000000-0000-4000-8000-0000000000a2";
const SELLER_SUSPENDED_USER = "00000000-0000-4000-8000-0000000000a3";
const SELLER_A = "00000000-0000-4000-8006-000000000001";
const SELLER_B = "00000000-0000-4000-8006-000000000002";
const SELLER_SUSPENDED = "00000000-0000-4000-8006-000000000003";
const WAREHOUSE_A = "00000000-0000-4000-8007-000000000001";
const WAREHOUSE_B = "00000000-0000-4000-8007-000000000002";
const PRODUCT_A = "40000000-0000-4000-8000-000000000001";
const PRODUCT_B = "40000000-0000-4000-8000-000000000002";
const ORDER_A = "50000000-0000-4000-8000-000000000001";
const ORDER_B = "50000000-0000-4000-8000-000000000002";

class DeterministicTokens implements SessionTokenGenerator {
  private count = 0;

  generate(): { token: string; tokenHash: string } {
    this.count += 1;
    const token = `seller-token-${this.count}`;
    return { token, tokenHash: hashSessionToken(token) };
  }
}

function profile(
  id: string,
  usuarioId: string,
  estado: SellerProfileView["estado"] = "ACTIVO"
): SellerProfileView {
  return {
    id,
    usuarioId,
    nombreComercial: `Comercio ${id.slice(-1)}`,
    estado,
    creadoEn: NOW,
    nombreCompleto: "Vendedor Demo",
    correoElectronico: `${id.slice(-1)}@nexusmarket.demo`
  };
}

function warehouse(
  id: string,
  vendedorId: string,
  estado: SellerWarehouseView["estado"] = "ACTIVA"
): SellerWarehouseView {
  return {
    id,
    vendedorId,
    nombre: `Bodega ${id.slice(-1)}`,
    ubicacion: "Bogotá",
    estado,
    creadaEn: NOW
  };
}

function product(
  id: string,
  vendedorId: string,
  overrides: Partial<SellerProductView> = {}
): SellerProductView {
  return {
    id,
    vendedorId,
    nombre: `Producto ${id.slice(-1)}`,
    descripcion: "Descripción del producto",
    categoria: "HOGAR",
    tipoEntrega: "FISICA",
    sku: `SKU-${id.slice(-1)}`,
    precioCentavos: 10000,
    moneda: "COP",
    estado: "BORRADOR",
    creadoEn: NOW,
    actualizadoEn: NOW,
    imagenes: [],
    inventario: { onHand: 0, reserved: 0, unavailable: 0, disponible: 0 },
    ...overrides
  };
}

function order(id: string): SellerOrderDetail {
  return {
    id,
    numero: `NM-2026-${id.slice(-1)}`,
    estado: "PAGADO",
    estadoPago: "CAPTURADO",
    moneda: "COP",
    totalCentavos: 10000,
    itemsCount: 1,
    creadoEn: NOW,
    items: [
      {
        id: `${id}-item`,
        productoId: PRODUCT_A,
        nombreProducto: "Producto",
        sku: "SKU-1",
        tipoEntrega: "FISICA",
        cantidad: 1,
        precioUnitarioCentavos: 10000,
        moneda: "COP",
        subtotalCentavos: 10000
      }
    ]
  };
}

interface Harness {
  readonly app: FastifyInstance;
  readonly store: FakeSellerWorkspaceStore;
}

async function createHarness(): Promise<Harness> {
  const identity = new FakeIdentityStore([
    {
      usuarioId: ADMIN_USER,
      nombreCompleto: "Administradora",
      correoElectronico: "admin@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "ADMINISTRADOR",
      estado: "ACTIVO"
    },
    {
      usuarioId: BUYER_USER,
      nombreCompleto: "Compradora",
      correoElectronico: "compradora@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "COMPRADOR",
      estado: "ACTIVO",
      compradorId: BUYER_PROFILE
    },
    {
      usuarioId: SELLER_A_USER,
      nombreCompleto: "Vendedor A",
      correoElectronico: "vendedor.a@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "VENDEDOR",
      estado: "ACTIVO",
      sellerId: SELLER_A
    },
    {
      usuarioId: SELLER_B_USER,
      nombreCompleto: "Vendedor B",
      correoElectronico: "vendedor.b@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "VENDEDOR",
      estado: "ACTIVO",
      sellerId: SELLER_B
    },
    {
      usuarioId: SELLER_SUSPENDED_USER,
      nombreCompleto: "Vendedor Suspendido",
      correoElectronico: "vendedor.s@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "VENDEDOR",
      estado: "ACTIVO",
      sellerId: SELLER_SUSPENDED
    }
  ]);

  const store = new FakeSellerWorkspaceStore();
  store.seedProfile(profile(SELLER_A, SELLER_A_USER));
  store.seedProfile(profile(SELLER_B, SELLER_B_USER));
  store.seedProfile(profile(SELLER_SUSPENDED, SELLER_SUSPENDED_USER, "SUSPENDIDO"));
  store.seedWarehouse(warehouse(WAREHOUSE_A, SELLER_A));
  store.seedWarehouse(warehouse(WAREHOUSE_B, SELLER_B));
  store.seedProduct(product(PRODUCT_A, SELLER_A));
  store.seedProduct(
    product(PRODUCT_B, SELLER_B, {
      estado: "PUBLICADO",
      imagenes: [{ id: "img-b", url: "/products/b.svg", alt: "", orden: 0 }]
    })
  );
  store.seedOrder(SELLER_A, order(ORDER_A));
  store.seedOrder(SELLER_B, order(ORDER_B));

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
      addresses: new FakeAddressStore(),
      sellerWorkspace: store
    }
  );

  return { app, store };
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

describe("HTTP del espacio del vendedor", () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("exige autenticación y rol VENDEDOR", async () => {
    const anonymous = await harness.app.inject({
      method: "GET",
      url: "/api/v1/seller/profile"
    });
    expect(anonymous.statusCode).toBe(401);

    const buyer = await login(harness.app, "compradora@nexusmarket.demo");
    const asBuyer = await harness.app.inject({
      method: "GET",
      url: "/api/v1/seller/profile",
      headers: bearer(buyer)
    });
    expect(asBuyer.statusCode).toBe(403);

    const admin = await login(harness.app, "admin@nexusmarket.demo");
    const asAdmin = await harness.app.inject({
      method: "GET",
      url: "/api/v1/seller/profile",
      headers: bearer(admin)
    });
    expect(asAdmin.statusCode).toBe(403);
  });

  it("consulta y actualiza el nombre comercial del propio vendedor", async () => {
    const token = await login(harness.app, "vendedor.a@nexusmarket.demo");

    const current = await harness.app.inject({
      method: "GET",
      url: "/api/v1/seller/profile",
      headers: bearer(token)
    });
    expect(current.statusCode).toBe(200);
    expect(current.json().data).toMatchObject({ id: SELLER_A });

    const updated = await harness.app.inject({
      method: "PATCH",
      url: "/api/v1/seller/profile",
      headers: bearer(token),
      payload: { nombreComercial: "Estudio Aurora" }
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.nombreComercial).toBe("Estudio Aurora");

    const invalid = await harness.app.inject({
      method: "PATCH",
      url: "/api/v1/seller/profile",
      headers: bearer(token),
      payload: { nombreComercial: "   " }
    });
    expect(invalid.statusCode).toBe(400);
  });

  it("recorre creación, imagen, publicación, suspensión, reanudación y descontinuación", async () => {
    const token = await login(harness.app, "vendedor.a@nexusmarket.demo");
    const headers = bearer(token);

    const created = await harness.app.inject({
      method: "POST",
      url: "/api/v1/seller/products",
      headers,
      payload: {
        nombre: "Lámpara de mesa",
        descripcion: "Lámpara artesanal",
        categoria: "HOGAR",
        tipoEntrega: "FISICA",
        sku: "LAMP-HTTP-001",
        precioCentavos: 55000,
        moneda: "cop"
      }
    });
    expect(created.statusCode).toBe(201);
    const productId = created.json().data.id as string;
    expect(created.json().data).toMatchObject({
      estado: "BORRADOR",
      vendedorId: SELLER_A,
      moneda: "COP"
    });

    const withoutImage = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/products/${productId}/publish`,
      headers
    });
    expect(withoutImage.statusCode).toBe(422);
    expect(withoutImage.json().error.detalles.motivo).toBe("PRODUCTO_NO_PUBLICABLE");

    const withImage = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/products/${productId}/images`,
      headers,
      payload: { url: "/products/lampara.svg", alt: "Lámpara" }
    });
    expect(withImage.statusCode).toBe(201);
    expect(withImage.json().data.imagenes).toHaveLength(1);

    const published = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/products/${productId}/publish`,
      headers
    });
    expect(published.statusCode).toBe(200);
    expect(published.json().data.estado).toBe("PUBLICADO");

    const suspended = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/products/${productId}/suspend`,
      headers
    });
    expect(suspended.statusCode).toBe(200);
    expect(suspended.json().data.estado).toBe("SUSPENDIDO");

    const resumed = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/products/${productId}/publish`,
      headers
    });
    expect(resumed.statusCode).toBe(200);
    expect(resumed.json().data.estado).toBe("PUBLICADO");

    const discontinued = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/products/${productId}/discontinue`,
      headers
    });
    expect(discontinued.statusCode).toBe(200);
    expect(discontinued.json().data.estado).toBe("DESCONTINUADO");

    const reactivate = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/products/${productId}/publish`,
      headers
    });
    expect(reactivate.statusCode).toBe(422);
    expect(reactivate.json().error.detalles.motivo).toBe("PRODUCTO_DESCONTINUADO");
  });

  it("aísla productos, bodegas y pedidos de otros vendedores con 404", async () => {
    const token = await login(harness.app, "vendedor.a@nexusmarket.demo");
    const headers = bearer(token);

    const otherProduct = await harness.app.inject({
      method: "GET",
      url: `/api/v1/seller/products/${PRODUCT_B}`,
      headers
    });
    expect(otherProduct.statusCode).toBe(404);

    const otherProductUpdate = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/seller/products/${PRODUCT_B}`,
      headers,
      payload: { nombre: "Intrusión" }
    });
    expect(otherProductUpdate.statusCode).toBe(404);

    const otherImage = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/products/${PRODUCT_B}/images`,
      headers,
      payload: { url: "/products/x.svg" }
    });
    expect(otherImage.statusCode).toBe(404);

    const otherWarehouse = await harness.app.inject({
      method: "PATCH",
      url: `/api/v1/seller/warehouses/${WAREHOUSE_B}`,
      headers,
      payload: { nombre: "Intrusión" }
    });
    expect(otherWarehouse.statusCode).toBe(404);

    const otherIngress = await harness.app.inject({
      method: "POST",
      url: "/api/v1/seller/inventory/ingresos",
      headers,
      payload: {
        productoId: PRODUCT_B,
        bodegaId: WAREHOUSE_A,
        cantidad: 1,
        idempotencyKey: "cross-1"
      }
    });
    expect(otherIngress.statusCode).toBe(404);

    const otherOrder = await harness.app.inject({
      method: "GET",
      url: `/api/v1/seller/orders/${ORDER_B}`,
      headers
    });
    expect(otherOrder.statusCode).toBe(404);

    const ownOrders = await harness.app.inject({
      method: "GET",
      url: "/api/v1/seller/orders",
      headers
    });
    expect(ownOrders.statusCode).toBe(200);
    expect(ownOrders.json().data.map((item: { id: string }) => item.id)).toEqual([
      ORDER_A
    ]);
  });

  it("registra ingresos de inventario idempotentes y consulta el saldo", async () => {
    const token = await login(harness.app, "vendedor.a@nexusmarket.demo");
    const headers = bearer(token);
    const payload = {
      productoId: PRODUCT_A,
      bodegaId: WAREHOUSE_A,
      cantidad: 7,
      idempotencyKey: "http-ingreso-1"
    };

    const first = await harness.app.inject({
      method: "POST",
      url: "/api/v1/seller/inventory/ingresos",
      headers,
      payload
    });
    expect(first.statusCode).toBe(201);
    expect(first.json().data).toMatchObject({
      duplicado: false,
      posicion: { onHand: 7, disponible: 7 }
    });

    const repeated = await harness.app.inject({
      method: "POST",
      url: "/api/v1/seller/inventory/ingresos",
      headers,
      payload
    });
    expect(repeated.statusCode).toBe(200);
    expect(repeated.json().data).toMatchObject({
      duplicado: true,
      posicion: { onHand: 7 }
    });

    const inventory = await harness.app.inject({
      method: "GET",
      url: "/api/v1/seller/inventory",
      headers
    });
    expect(inventory.statusCode).toBe(200);
    expect(inventory.json().data).toHaveLength(1);
    expect(inventory.json().data[0]).toMatchObject({
      productoId: PRODUCT_A,
      bodegaId: WAREHOUSE_A,
      onHand: 7
    });
  });

  it("bloquea mutaciones de un vendedor suspendido y permite consultar", async () => {
    const token = await login(harness.app, "vendedor.s@nexusmarket.demo");
    const headers = bearer(token);

    const read = await harness.app.inject({
      method: "GET",
      url: "/api/v1/seller/products",
      headers
    });
    expect(read.statusCode).toBe(200);

    const create = await harness.app.inject({
      method: "POST",
      url: "/api/v1/seller/products",
      headers,
      payload: {
        nombre: "Producto",
        descripcion: "Descripción",
        categoria: "HOGAR",
        tipoEntrega: "FISICA",
        sku: "SUSP-001",
        precioCentavos: 1000,
        moneda: "COP"
      }
    });
    expect(create.statusCode).toBe(403);
  });

  it("no expone operaciones de pago, logística ni administración al vendedor", async () => {
    const token = await login(harness.app, "vendedor.a@nexusmarket.demo");
    const headers = bearer(token);

    const confirmPayment = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/orders/${ORDER_A}/confirm-payment`,
      headers
    });
    expect(confirmPayment.statusCode).toBe(404);

    const dispatch = await harness.app.inject({
      method: "POST",
      url: `/api/v1/seller/orders/${ORDER_A}/dispatch`,
      headers
    });
    expect(dispatch.statusCode).toBe(404);

    const buyers = await harness.app.inject({
      method: "GET",
      url: "/api/v1/buyers/me/addresses",
      headers
    });
    expect(buyers.statusCode).toBe(403);
  });
});
