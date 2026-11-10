import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { SessionTokenGenerator } from "../../src/shared/application/ports.js";
import { hashSessionToken } from "../../src/shared/infrastructure/session-tokens.js";
import type {
  SupervisorInventoryView,
  SupervisorOrderDetail,
  SupervisorProductDetail,
  SupervisorSellerView,
  SupervisorShipmentSummary,
  SupervisorWarehouseView
} from "../../src/modules/supervisor/application/ports.js";
import { FakeCatalogQueryRepository } from "../support/fake-catalog-query-repository.js";
import { FakeBuyerRegistrationStore } from "../support/fake-buyer-registration-store.js";
import { FakeSupervisorStore } from "../support/fake-supervisor-store.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import {
  FakeAddressStore,
  FakeIdentityStore,
  FakePasswordHasher
} from "../support/fakes.js";

const PASSWORD = "NexusMarketDemo2026!";
const NOW = "2026-11-06T12:00:00.000Z";

const SUPERVISOR_USER = "90000000-0000-4000-8000-000000000001";
const INACTIVE_SUPERVISOR_USER = "90000000-0000-4000-8000-000000000002";
const ADMIN_USER = "90000000-0000-4000-8000-0000000000ad";
const BUYER_USER = "90000000-0000-4000-8000-0000000000b1";
const SELLER_USER = "90000000-0000-4000-8000-0000000000e1";
const LOGISTICS_USER = "90000000-0000-4000-8000-0000000000f1";

const SELLER_ID = "20000000-0000-4000-8000-000000000001";
const WAREHOUSE_ID = "30000000-0000-4000-8000-000000000001";
const PRODUCT_ID = "40000000-0000-4000-8000-000000000001";
const ORDER_ID = "50000000-0000-4000-8000-000000000001";
const SHIPMENT_ID = "60000000-0000-4000-8000-000000000001";

class DeterministicTokens implements SessionTokenGenerator {
  private count = 0;

  generate(): { token: string; tokenHash: string } {
    this.count += 1;
    const token = `supervisor-token-${this.count}`;
    return { token, tokenHash: hashSessionToken(token) };
  }
}

function orderDetail(
  overrides: Partial<SupervisorOrderDetail> = {}
): SupervisorOrderDetail {
  return {
    id: ORDER_ID,
    numero: "NM-2026-0100",
    estado: "EN_PREPARACION",
    estadoPago: "CAPTURADO",
    moneda: "COP",
    totalCentavos: 42990000,
    itemsCount: 1,
    vendedorId: SELLER_ID,
    vendedorNombre: "Estudio Aurora",
    creadoEn: NOW,
    actualizadoEn: NOW,
    items: [
      {
        id: "51000000-0000-4000-8000-000000000001",
        productoId: PRODUCT_ID,
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
      estado: "CAPTURADO",
      proveedor: "SIMULADO",
      montoCentavos: 42990000,
      moneda: "COP",
      creadoEn: NOW,
      actualizadoEn: NOW
    },
    reservas: [
      {
        id: "52000000-0000-4000-8000-000000000001",
        productoId: PRODUCT_ID,
        productoNombre: "Audífonos Aurora",
        sku: "AUR-AUD-001",
        bodegaId: WAREHOUSE_ID,
        bodegaNombre: "Bodega Aurora",
        cantidad: 1,
        estado: "ACTIVA",
        creadaEn: NOW
      }
    ],
    envios: [
      {
        id: SHIPMENT_ID,
        pedidoId: ORDER_ID,
        bodegaOrigenId: WAREHOUSE_ID,
        bodegaNombre: "Bodega Aurora",
        transportista: null,
        trackingNumber: null,
        estado: "PREPARACION",
        creadoEn: NOW,
        despachadoEn: null,
        entregadoEn: null,
        items: [
          {
            productoId: PRODUCT_ID,
            nombreProducto: "Audífonos Aurora",
            sku: "AUR-AUD-001",
            cantidad: 1
          }
        ],
        evidencia: null
      }
    ],
    historial: [
      {
        estadoPrevio: "PENDIENTE_DE_PAGO",
        estadoNuevo: "EN_PREPARACION",
        actorRol: "OPERADOR_LOGISTICO",
        ocurridoEn: NOW,
        referenciaTipo: "ENVIO",
        referenciaId: SHIPMENT_ID,
        correlationId: "corr-1"
      }
    ],
    ...overrides
  };
}

function productDetail(
  overrides: Partial<SupervisorProductDetail> = {}
): SupervisorProductDetail {
  return {
    id: PRODUCT_ID,
    vendedorId: SELLER_ID,
    vendedorNombre: "Estudio Aurora",
    nombre: "Audífonos Aurora",
    sku: "AUR-AUD-001",
    categoria: "ELECTRONICA",
    estado: "PUBLICADO",
    tipoEntrega: "FISICA",
    precioCentavos: 42990000,
    moneda: "COP",
    imagenesCount: 1,
    inventarioDisponible: 18,
    creadoEn: NOW,
    actualizadoEn: NOW,
    descripcion: "Audífonos inalámbricos.",
    imagenes: [
      {
        id: "41000000-0000-4000-8000-000000000001",
        url: "/products/audifonos.svg",
        alt: "Audífonos",
        orden: 0
      }
    ],
    inventario: [
      {
        bodegaId: WAREHOUSE_ID,
        bodegaNombre: "Bodega Aurora",
        onHand: 18,
        reserved: 0,
        unavailable: 0,
        disponible: 18,
        actualizadoEn: NOW
      }
    ],
    ...overrides
  };
}

const warehouse: SupervisorWarehouseView = {
  id: WAREHOUSE_ID,
  nombre: "Bodega Aurora",
  ubicacion: "Bogotá, Colombia",
  tipo: "VENDEDOR",
  estado: "ACTIVA",
  vendedorId: SELLER_ID,
  vendedorNombre: "Estudio Aurora",
  creadaEn: NOW
};

const inventory: SupervisorInventoryView = {
  productoId: PRODUCT_ID,
  productoNombre: "Audífonos Aurora",
  sku: "AUR-AUD-001",
  bodegaId: WAREHOUSE_ID,
  bodegaNombre: "Bodega Aurora",
  vendedorId: SELLER_ID,
  vendedorNombre: "Estudio Aurora",
  onHand: 18,
  reserved: 0,
  unavailable: 0,
  disponible: 18,
  actualizadoEn: NOW
};

const shipment: SupervisorShipmentSummary = {
  id: SHIPMENT_ID,
  pedidoId: ORDER_ID,
  pedidoNumero: "NM-2026-0100",
  bodegaOrigenId: WAREHOUSE_ID,
  bodegaNombre: "Bodega Aurora",
  transportista: null,
  trackingNumber: null,
  estado: "PREPARACION",
  creadoEn: NOW,
  despachadoEn: null,
  entregadoEn: null
};

const seller: SupervisorSellerView = {
  id: SELLER_ID,
  nombreComercial: "Estudio Aurora",
  estado: "ACTIVO",
  creadoEn: NOW,
  productosCount: 1,
  productosPublicadosCount: 1,
  bodegasCount: 1,
  inventarioDisponible: 18
};

interface Harness {
  readonly app: FastifyInstance;
  readonly store: FakeSupervisorStore;
}

async function createHarness(): Promise<Harness> {
  const identity = new FakeIdentityStore([
    {
      usuarioId: SUPERVISOR_USER,
      nombreCompleto: "Supervisora Demo",
      correoElectronico: "supervisor@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "SUPERVISOR",
      estado: "ACTIVO"
    },
    {
      usuarioId: INACTIVE_SUPERVISOR_USER,
      nombreCompleto: "Supervisor Inactivo",
      correoElectronico: "supervisor.inactivo@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "SUPERVISOR",
      estado: "INACTIVO"
    },
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
      compradorId: "71000000-0000-4000-8000-000000000001"
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

  const store = new FakeSupervisorStore();
  store.seedOrder(orderDetail());
  store.seedProduct(productDetail());
  store.seedWarehouse(warehouse);
  store.seedInventory([inventory]);
  store.seedShipments([shipment]);
  store.seedSellers([seller]);
  store.seedOperators(1, 0);
  store.seedBuyers(1, 0);

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
      supervisor: store
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

describe("HTTP del espacio de supervisión", () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("exige autenticación y rechaza a los demás roles, incluido el administrador", async () => {
    const anonymous = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/dashboard"
    });
    expect(anonymous.statusCode).toBe(401);

    for (const email of [
      "compradora@nexusmarket.demo",
      "aurora@nexusmarket.demo",
      "logistica@nexusmarket.demo",
      "admin@nexusmarket.demo"
    ]) {
      const token = await login(harness.app, email);
      const response = await harness.app.inject({
        method: "GET",
        url: "/api/v1/supervisor/dashboard",
        headers: bearer(token)
      });
      expect(response.statusCode, `${email} no debe acceder`).toBe(403);
      expect(response.json().error.codigo).toBe("NO_AUTORIZADO");
    }

    const supervisor = await login(harness.app, "supervisor@nexusmarket.demo");
    const response = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/dashboard",
      headers: bearer(supervisor)
    });
    expect(response.statusCode).toBe(200);
  });

  it("rechaza a un supervisor inactivo en el inicio de sesión", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        correoElectronico: "supervisor.inactivo@nexusmarket.demo",
        credencial: PASSWORD
      }
    });
    expect(response.statusCode).toBe(401);
  });

  it("devuelve un dashboard construido con conteos directos de estados definidos", async () => {
    const token = await login(harness.app, "supervisor@nexusmarket.demo");
    const response = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/dashboard",
      headers: bearer(token)
    });
    expect(response.statusCode).toBe(200);
    const data = response.json().data;
    expect(data).toMatchObject({
      pedidosTotal: 1,
      pedidosPorEstado: { EN_PREPARACION: 1, ENTREGADO: 0, CERRADO: 0 },
      pagosPorEstado: { CAPTURADO: 1, PENDIENTE: 0 },
      productosTotal: 1,
      productosPorEstado: { PUBLICADO: 1, BORRADOR: 0 },
      inventario: {
        posiciones: 1,
        onHand: 18,
        reserved: 0,
        unavailable: 0,
        disponible: 18
      },
      almacenesPorEstado: { ACTIVA: 1, INACTIVA: 0 },
      enviosPorEstado: { PREPARACION: 1, ENTREGADO: 0 },
      vendedoresPorEstado: { ACTIVO: 1 },
      operadoresLogisticosPorEstado: { ACTIVO: 1, INACTIVO: 0 },
      compradoresPorEstado: { HABILITADO: 1, RESTRINGIDO: 0 }
    });
  });

  it("consulta pedidos, productos, almacenes, inventario, envíos y vendedores", async () => {
    const token = await login(harness.app, "supervisor@nexusmarket.demo");
    const headers = bearer(token);

    const orders = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/orders?estado=EN_PREPARACION&page=1&pageSize=10",
      headers
    });
    expect(orders.statusCode).toBe(200);
    expect(orders.json().data).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 10,
      items: [{ id: ORDER_ID, estado: "EN_PREPARACION" }]
    });

    const order = await harness.app.inject({
      method: "GET",
      url: `/api/v1/supervisor/orders/${ORDER_ID}`,
      headers
    });
    expect(order.statusCode).toBe(200);
    expect(order.json().data).toMatchObject({
      id: ORDER_ID,
      items: [{ sku: "AUR-AUD-001" }],
      pago: { estado: "CAPTURADO" },
      envios: [{ estado: "PREPARACION" }]
    });

    const products = await harness.app.inject({
      method: "GET",
      url: `/api/v1/supervisor/products?categoria=ELECTRONICA&vendedorId=${SELLER_ID}`,
      headers
    });
    expect(products.statusCode).toBe(200);
    expect(products.json().data.items[0]).toMatchObject({
      id: PRODUCT_ID,
      estado: "PUBLICADO",
      inventarioDisponible: 18
    });

    const product = await harness.app.inject({
      method: "GET",
      url: `/api/v1/supervisor/products/${PRODUCT_ID}`,
      headers
    });
    expect(product.statusCode).toBe(200);
    expect(product.json().data).toMatchObject({
      id: PRODUCT_ID,
      inventario: [{ disponible: 18 }]
    });

    const warehouses = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/warehouses",
      headers
    });
    expect(warehouses.statusCode).toBe(200);
    expect(warehouses.json().data).toHaveLength(1);

    const inventory = await harness.app.inject({
      method: "GET",
      url: `/api/v1/supervisor/inventory?bodegaId=${WAREHOUSE_ID}`,
      headers
    });
    expect(inventory.statusCode).toBe(200);
    expect(inventory.json().data.items[0]).toMatchObject({ disponible: 18 });

    const shipments = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/shipments?estado=PREPARACION",
      headers
    });
    expect(shipments.statusCode).toBe(200);
    expect(shipments.json().data.items[0]).toMatchObject({
      id: SHIPMENT_ID,
      pedidoNumero: "NM-2026-0100"
    });

    const sellers = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/sellers?estado=ACTIVO",
      headers
    });
    expect(sellers.statusCode).toBe(200);
    expect(sellers.json().data.items[0]).toMatchObject({
      id: SELLER_ID,
      productosPublicadosCount: 1
    });
  });

  it("responde 404 para recursos inexistentes y 400 para filtros inválidos", async () => {
    const token = await login(harness.app, "supervisor@nexusmarket.demo");
    const headers = bearer(token);

    const missingOrder = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/orders/00000000-0000-4000-8000-000000000000",
      headers
    });
    expect(missingOrder.statusCode).toBe(404);

    const missingProduct = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/products/00000000-0000-4000-8000-000000000000",
      headers
    });
    expect(missingProduct.statusCode).toBe(404);

    const invalid = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/orders?estado=NO_EXISTE",
      headers
    });
    expect(invalid.statusCode).toBe(400);

    const invalidPage = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/orders?page=0",
      headers
    });
    expect(invalidPage.statusCode).toBe(400);
  });

  it("rechaza cualquier método de escritura bajo el prefijo del supervisor", async () => {
    const token = await login(harness.app, "supervisor@nexusmarket.demo");
    const headers = bearer(token);

    for (const [method, url] of [
      ["POST", "/api/v1/supervisor/dashboard"],
      ["PATCH", `/api/v1/supervisor/orders/${ORDER_ID}`],
      ["DELETE", `/api/v1/supervisor/products/${PRODUCT_ID}`],
      ["PUT", "/api/v1/supervisor/inventory"]
    ] as const) {
      const response = await harness.app.inject({ method, url, headers });
      expect(response.statusCode, `${method} ${url}`).toBe(405);
      expect(response.json().error.codigo).toBe("METODO_NO_PERMITIDO");
    }
  });

  it("no expone datos personales ni direcciones de entrega", async () => {
    const token = await login(harness.app, "supervisor@nexusmarket.demo");
    const headers = bearer(token);

    for (const url of [
      "/api/v1/supervisor/orders",
      `/api/v1/supervisor/orders/${ORDER_ID}`,
      "/api/v1/supervisor/sellers"
    ]) {
      const response = await harness.app.inject({
        method: "GET",
        url,
        headers
      });
      expect(response.statusCode).toBe(200);
      const body = response.body;
      for (const forbidden of [
        "direccionEntrega",
        "correoElectronico",
        "documento",
        "telefono",
        "nombreCompleto",
        "actorId"
      ]) {
        expect(body, `${url} no debe contener ${forbidden}`).not.toContain(
          forbidden
        );
      }
    }
  });

  it("las consultas no modifican el estado observado", async () => {
    const token = await login(harness.app, "supervisor@nexusmarket.demo");
    const headers = bearer(token);

    const before = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/dashboard",
      headers
    });

    await harness.app.inject({
      method: "GET",
      url: `/api/v1/supervisor/orders/${ORDER_ID}`,
      headers
    });
    await harness.app.inject({
      method: "GET",
      url: `/api/v1/supervisor/products/${PRODUCT_ID}`,
      headers
    });

    const after = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/dashboard",
      headers
    });
    expect(after.json().data).toEqual(before.json().data);
  });

  it("devuelve 404 en rutas de lectura desconocidas y 405 en escritura desconocida", async () => {
    const token = await login(harness.app, "supervisor@nexusmarket.demo");
    const headers = bearer(token);

    const unknownGet = await harness.app.inject({
      method: "GET",
      url: "/api/v1/supervisor/no-existe",
      headers
    });
    expect(unknownGet.statusCode).toBe(404);

    const unknownPost = await harness.app.inject({
      method: "POST",
      url: "/api/v1/supervisor/no-existe",
      headers
    });
    expect(unknownPost.statusCode).toBe(405);
  });
});
