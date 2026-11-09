import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { SessionTokenGenerator } from "../../src/shared/application/ports.js";
import { hashSessionToken } from "../../src/shared/infrastructure/session-tokens.js";
import type {
  AdminBuyerDetail,
  AdminInventoryView,
  AdminMovementView,
  AdminOrderDetail,
  AdminPaymentSummary,
  AdminProductDetail,
  AdminSellerDetail,
  AdminUserDetail,
  AdminWarehouseDetail
} from "../../src/modules/admin/application/ports.js";
import { FakeAdminStore } from "../support/fake-admin-store.js";
import { FakeCatalogQueryRepository } from "../support/fake-catalog-query-repository.js";
import { FakeBuyerRegistrationStore } from "../support/fake-buyer-registration-store.js";
import { FakeLogisticsStore } from "../support/fake-logistics-store.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import {
  FakeAddressStore,
  FakeIdentityStore,
  FakePasswordHasher,
  FakeSellerRegistrationStore
} from "../support/fakes.js";

const PASSWORD = "NexusMarketDemo2026!";
const NOW = "2026-11-06T12:00:00.000Z";

const ADMIN_USER = "90000000-0000-4000-8000-0000000000ad";
const INACTIVE_ADMIN_USER = "90000000-0000-4000-8000-0000000000ae";
const SUPERVISOR_USER = "90000000-0000-4000-8000-000000000001";
const BUYER_USER = "90000000-0000-4000-8000-0000000000b1";
const SELLER_USER = "90000000-0000-4000-8000-0000000000e1";
const LOGISTICS_USER = "90000000-0000-4000-8000-0000000000f1";

const BUYER_ID = "71000000-0000-4000-8000-000000000001";
const SELLER_ID = "20000000-0000-4000-8000-000000000001";
const WAREHOUSE_ID = "30000000-0000-4000-8000-000000000001";
const PRODUCT_ID = "40000000-0000-4000-8000-000000000001";
const ORDER_ID = "50000000-0000-4000-8000-000000000001";
const PAYMENT_ID = "51000000-0000-4000-8000-000000000001";
const MOVEMENT_ID = "52000000-0000-4000-8000-000000000001";

class DeterministicTokens implements SessionTokenGenerator {
  private count = 0;

  generate(): { token: string; tokenHash: string } {
    this.count += 1;
    const token = `admin-token-${this.count}`;
    return { token, tokenHash: hashSessionToken(token) };
  }
}

const user: AdminUserDetail = {
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

const buyer: AdminBuyerDetail = {
  id: BUYER_ID,
  usuarioId: BUYER_USER,
  nombreCompleto: "Compradora Demo",
  correoElectronico: "compradora@nexusmarket.demo",
  estadoComercial: "HABILITADO",
  usuarioEstado: "ACTIVO",
  creadoEn: NOW,
  pedidosCount: 1,
  pedidos: [
    {
      id: ORDER_ID,
      numero: "NM-2026-0100",
      estado: "EN_PREPARACION",
      estadoPago: "CAPTURADO",
      moneda: "COP",
      totalCentavos: 42990000,
      vendedorNombre: "Estudio Aurora",
      creadoEn: NOW
    }
  ]
};

const seller: AdminSellerDetail = {
  id: SELLER_ID,
  usuarioId: SELLER_USER,
  nombreComercial: "Estudio Aurora",
  correoElectronico: "aurora@nexusmarket.demo",
  usuarioEstado: "ACTIVO",
  estado: "ACTIVO",
  creadoEn: NOW,
  productosCount: 1,
  productosPublicadosCount: 1,
  bodegasCount: 1,
  inventarioDisponible: 18,
  bodegas: [],
  productos: [],
  inventario: {
    posiciones: 1,
    onHand: 18,
    reserved: 0,
    unavailable: 0,
    disponible: 18
  },
  pedidosCount: 1
};

const warehouse: AdminWarehouseDetail = {
  id: WAREHOUSE_ID,
  nombre: "Bodega Aurora",
  ubicacion: "Bogotá, Colombia",
  tipo: "VENDEDOR",
  estado: "ACTIVA",
  vendedorId: SELLER_ID,
  vendedorNombre: "Estudio Aurora",
  vendedorCorreo: "aurora@nexusmarket.demo",
  creadaEn: NOW,
  productosCount: 1,
  inventarioDisponible: 18,
  inventario: [
    {
      productoId: PRODUCT_ID,
      productoNombre: "Audífonos Aurora",
      sku: "AUR-AUD-001",
      onHand: 18,
      reserved: 0,
      unavailable: 0,
      disponible: 18,
      actualizadoEn: NOW
    }
  ],
  movimientos: [],
  operadores: []
};

const product: AdminProductDetail = {
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
  imagenPrincipal: "/products/audifonos.svg",
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
  ]
};

const inventory: AdminInventoryView = {
  productoId: PRODUCT_ID,
  productoNombre: "Audífonos Aurora",
  sku: "AUR-AUD-001",
  vendedorId: SELLER_ID,
  vendedorNombre: "Estudio Aurora",
  bodegaId: WAREHOUSE_ID,
  bodegaNombre: "Bodega Aurora",
  onHand: 18,
  reserved: 0,
  unavailable: 0,
  disponible: 18,
  actualizadoEn: NOW
};

const movement: AdminMovementView = {
  id: MOVEMENT_ID,
  productoId: PRODUCT_ID,
  productoNombre: "Audífonos Aurora",
  sku: "AUR-AUD-001",
  bodegaId: WAREHOUSE_ID,
  bodegaNombre: "Bodega Aurora",
  vendedorId: SELLER_ID,
  vendedorNombre: "Estudio Aurora",
  tipo: "INGRESO",
  cantidad: 18,
  referenciaTipo: "AJUSTE",
  referenciaId: "53000000-0000-4000-8000-000000000001",
  motivo: "Carga inicial",
  ocurridoEn: NOW
};

const order: AdminOrderDetail = {
  id: ORDER_ID,
  numero: "NM-2026-0100",
  estado: "EN_PREPARACION",
  estadoPago: "CAPTURADO",
  moneda: "COP",
  totalCentavos: 42990000,
  itemsCount: 1,
  compradorId: BUYER_ID,
  compradorNombre: "Compradora Demo",
  vendedorId: SELLER_ID,
  vendedorNombre: "Estudio Aurora",
  creadoEn: NOW,
  actualizadoEn: NOW,
  items: [
    {
      id: "54000000-0000-4000-8000-000000000001",
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
  reservas: [],
  envios: [],
  historial: [
    {
      estadoPrevio: "PENDIENTE_DE_PAGO",
      estadoNuevo: "EN_PREPARACION",
      actorRol: "OPERADOR_LOGISTICO",
      ocurridoEn: NOW,
      referenciaTipo: "ENVIO",
      referenciaId: "55000000-0000-4000-8000-000000000001",
      correlationId: "corr-1"
    }
  ],
  entrega: {
    ciudad: "Bogotá",
    region: "Cundinamarca",
    pais: "CO",
    capturadaEn: NOW
  }
};

const payment: AdminPaymentSummary = {
  id: PAYMENT_ID,
  pedidoId: ORDER_ID,
  pedidoNumero: "NM-2026-0100",
  compradorId: BUYER_ID,
  compradorNombre: "Compradora Demo",
  vendedorNombre: "Estudio Aurora",
  estado: "CAPTURADO",
  proveedor: "SIMULADO",
  montoCentavos: 42990000,
  moneda: "COP",
  creadoEn: NOW,
  actualizadoEn: NOW
};

interface Harness {
  readonly app: FastifyInstance;
  readonly store: FakeAdminStore;
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
      usuarioId: INACTIVE_ADMIN_USER,
      nombreCompleto: "Administrador Inactivo",
      correoElectronico: "admin.inactivo@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "ADMINISTRADOR",
      estado: "INACTIVO"
    },
    {
      usuarioId: SUPERVISOR_USER,
      nombreCompleto: "Supervisora Demo",
      correoElectronico: "supervisor@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "SUPERVISOR",
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

  const store = new FakeAdminStore();
  store.seedUser(user);
  store.seedBuyer(buyer);
  store.seedSeller(seller);
  store.seedWarehouse(warehouse);
  store.seedProduct(product);
  store.seedInventory([inventory]);
  store.seedMovements([movement]);
  store.seedOrder(order);
  store.seedPayments([payment]);

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
      sellers: new FakeSellerRegistrationStore(),
      logistics: new FakeLogisticsStore(),
      admin: store
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

describe("HTTP del espacio administrativo", () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("exige autenticación y rechaza a los demás roles", async () => {
    const anonymous = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/dashboard"
    });
    expect(anonymous.statusCode).toBe(401);

    for (const email of [
      "compradora@nexusmarket.demo",
      "aurora@nexusmarket.demo",
      "logistica@nexusmarket.demo",
      "supervisor@nexusmarket.demo"
    ]) {
      const token = await login(harness.app, email);
      const response = await harness.app.inject({
        method: "GET",
        url: "/api/v1/admin/dashboard",
        headers: bearer(token)
      });
      expect(response.statusCode, `${email} no debe acceder`).toBe(403);
      expect(response.json().error.codigo).toBe("NO_AUTORIZADO");
    }

    const admin = await login(harness.app, "admin@nexusmarket.demo");
    const response = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/dashboard",
      headers: bearer(admin)
    });
    expect(response.statusCode).toBe(200);
  });

  it("rechaza a un administrador inactivo en el inicio de sesión", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        correoElectronico: "admin.inactivo@nexusmarket.demo",
        credencial: PASSWORD
      }
    });
    expect(response.statusCode).toBe(401);
  });

  it("devuelve dashboard y reportes construidos con conteos directos", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(token);

    const dashboard = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/dashboard",
      headers
    });
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.json().data).toMatchObject({
      usuarios: { total: 1, porRol: { ADMINISTRADOR: 1 } },
      compradores: { total: 1, porEstado: { HABILITADO: 1 } },
      vendedores: { total: 1, porEstado: { ACTIVO: 1 } },
      bodegas: { total: 1, porEstado: { ACTIVA: 1 } },
      catalogo: { total: 1, porEstado: { PUBLICADO: 1 } },
      inventario: { posiciones: 1, disponible: 18 },
      pedidos: { total: 1, porEstado: { EN_PREPARACION: 1 } },
      pagos: { total: 1, porEstado: { CAPTURADO: 1 } },
      recientes: {
        usuarios: [{ id: ADMIN_USER }],
        compradores: [{ id: BUYER_ID }],
        vendedores: [{ id: SELLER_ID }],
        pedidos: [{ id: ORDER_ID }]
      }
    });

    const reports = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/reports",
      headers
    });
    expect(reports.statusCode).toBe(200);
    expect(reports.json().data).toMatchObject({
      usuarios: { total: 1 },
      inventario: { disponible: 18 }
    });
  });

  it("consulta usuarios, compradores, vendedores y bodegas", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(token);

    const users = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/users?rol=ADMINISTRADOR&estado=ACTIVO&search=admin",
      headers
    });
    expect(users.statusCode).toBe(200);
    expect(users.json().data.items[0]).toMatchObject({ id: ADMIN_USER });

    const userDetail = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/users/${ADMIN_USER}`,
      headers
    });
    expect(userDetail.statusCode).toBe(200);
    expect(userDetail.json().data).toMatchObject({ id: ADMIN_USER, perfil: null });

    const buyers = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/buyers?estadoComercial=HABILITADO",
      headers
    });
    expect(buyers.statusCode).toBe(200);
    expect(buyers.json().data.items[0]).toMatchObject({ id: BUYER_ID });

    const buyerDetail = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/buyers/${BUYER_ID}`,
      headers
    });
    expect(buyerDetail.statusCode).toBe(200);
    expect(buyerDetail.json().data.pedidos[0]).toMatchObject({ id: ORDER_ID });

    const sellers = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/sellers?estado=ACTIVO",
      headers
    });
    expect(sellers.statusCode).toBe(200);
    expect(sellers.json().data.items[0]).toMatchObject({ id: SELLER_ID });

    const sellerDetail = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/sellers/${SELLER_ID}`,
      headers
    });
    expect(sellerDetail.statusCode).toBe(200);
    expect(sellerDetail.json().data).toMatchObject({
      id: SELLER_ID,
      inventario: { disponible: 18 }
    });

    const warehouses = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/warehouses?vendedorId=${SELLER_ID}`,
      headers
    });
    expect(warehouses.statusCode).toBe(200);
    expect(warehouses.json().data.items[0]).toMatchObject({ id: WAREHOUSE_ID });

    const warehouseDetail = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/warehouses/${WAREHOUSE_ID}`,
      headers
    });
    expect(warehouseDetail.statusCode).toBe(200);
    expect(warehouseDetail.json().data.inventario[0]).toMatchObject({
      productoId: PRODUCT_ID,
      disponible: 18
    });
  });

  it("consulta catálogo, inventario, movimientos, pedidos y pagos", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(token);

    const products = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/products?categoria=ELECTRONICA&tipoEntrega=FISICA",
      headers
    });
    expect(products.statusCode).toBe(200);
    expect(products.json().data.items[0]).toMatchObject({ id: PRODUCT_ID });

    const productDetail = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/products/${PRODUCT_ID}`,
      headers
    });
    expect(productDetail.statusCode).toBe(200);
    expect(productDetail.json().data.inventario[0]).toMatchObject({
      disponible: 18
    });

    const inventoryResponse = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/inventory?bodegaId=${WAREHOUSE_ID}`,
      headers
    });
    expect(inventoryResponse.statusCode).toBe(200);
    expect(inventoryResponse.json().data.items[0]).toMatchObject({
      productoId: PRODUCT_ID,
      disponible: 18
    });

    const movements = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/inventory/movements?bodegaId=${WAREHOUSE_ID}`,
      headers
    });
    expect(movements.statusCode).toBe(200);
    expect(movements.json().data.items[0]).toMatchObject({ id: MOVEMENT_ID });

    const orders = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/orders?estado=EN_PREPARACION",
      headers
    });
    expect(orders.statusCode).toBe(200);
    expect(orders.json().data.items[0]).toMatchObject({ id: ORDER_ID });

    const orderDetail = await harness.app.inject({
      method: "GET",
      url: `/api/v1/admin/orders/${ORDER_ID}`,
      headers
    });
    expect(orderDetail.statusCode).toBe(200);
    expect(orderDetail.json().data).toMatchObject({
      id: ORDER_ID,
      pago: { estado: "CAPTURADO" },
      entrega: { ciudad: "Bogotá", pais: "CO" }
    });

    const payments = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/payments?estado=CAPTURADO",
      headers
    });
    expect(payments.statusCode).toBe(200);
    expect(payments.json().data.items[0]).toMatchObject({ id: PAYMENT_ID });
  });

  it("responde 404 para recursos inexistentes y 400 para filtros inválidos", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(token);
    const missing = "00000000-0000-4000-8000-000000000000";

    for (const url of [
      `/api/v1/admin/users/${missing}`,
      `/api/v1/admin/buyers/${missing}`,
      `/api/v1/admin/sellers/${missing}`,
      `/api/v1/admin/warehouses/${missing}`,
      `/api/v1/admin/products/${missing}`,
      `/api/v1/admin/orders/${missing}`
    ]) {
      const response = await harness.app.inject({ method: "GET", url, headers });
      expect(response.statusCode, url).toBe(404);
    }

    const invalidRole = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/users?rol=NO_EXISTE",
      headers
    });
    expect(invalidRole.statusCode).toBe(400);

    const invalidPage = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/orders?page=0",
      headers
    });
    expect(invalidPage.statusCode).toBe(400);

    const invalidId = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/orders/no-es-uuid",
      headers
    });
    expect(invalidId.statusCode).toBe(400);
  });

  it("rechaza escrituras no autorizadas bajo el prefijo administrativo", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(token);

    for (const [method, url] of [
      ["POST", "/api/v1/admin/dashboard"],
      ["PATCH", `/api/v1/admin/orders/${ORDER_ID}`],
      ["DELETE", `/api/v1/admin/products/${PRODUCT_ID}`],
      ["PUT", "/api/v1/admin/inventory"],
      ["PATCH", "/api/v1/admin/users/90000000-0000-4000-8000-0000000000ad"]
    ] as const) {
      const response = await harness.app.inject({ method, url, headers });
      expect(response.statusCode, `${method} ${url}`).toBe(405);
      expect(response.json().error.codigo).toBe("METODO_NO_PERMITIDO");
    }
  });

  it("mantiene las altas administrativas existentes fuera de la guarda de solo lectura", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(token);

    const invalidSeller = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/sellers",
      headers,
      payload: {}
    });
    expect(invalidSeller.statusCode).toBe(400);

    const invalidOperator = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/logistics-operators",
      headers,
      payload: {}
    });
    expect(invalidOperator.statusCode).toBe(400);
  });

  it("no expone credenciales, documentos, tokens ni direcciones completas", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(token);

    for (const url of [
      "/api/v1/admin/users",
      `/api/v1/admin/users/${ADMIN_USER}`,
      "/api/v1/admin/buyers",
      "/api/v1/admin/sellers",
      `/api/v1/admin/orders/${ORDER_ID}`,
      "/api/v1/admin/payments"
    ]) {
      const response = await harness.app.inject({ method: "GET", url, headers });
      expect(response.statusCode).toBe(200);
      for (const forbidden of [
        "hashCredencial",
        "hash_credencial",
        "documento",
        "token",
        "linea1",
        "destinatario",
        "telefono",
        "proveedorReferencia",
        "referenciaExterna"
      ]) {
        expect(response.body, `${url} no debe contener ${forbidden}`).not.toContain(
          forbidden
        );
      }
    }
  });

  it("devuelve 404 en lecturas desconocidas y 405 en escrituras desconocidas", async () => {
    const token = await login(harness.app, "admin@nexusmarket.demo");
    const headers = bearer(token);

    const unknownGet = await harness.app.inject({
      method: "GET",
      url: "/api/v1/admin/no-existe",
      headers
    });
    expect(unknownGet.statusCode).toBe(404);

    const unknownPost = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/no-existe",
      headers
    });
    expect(unknownPost.statusCode).toBe(405);
  });
});
