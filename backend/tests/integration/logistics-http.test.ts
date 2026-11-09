import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { SessionTokenGenerator } from "../../src/shared/application/ports.js";
import { hashSessionToken } from "../../src/shared/infrastructure/session-tokens.js";
import type {
  LogisticsOrderDetail,
  LogisticsProfileView,
  LogisticsReservationView,
  LogisticsWarehouseView
} from "../../src/modules/logistics/application/ports.js";
import { FakeCatalogQueryRepository } from "../support/fake-catalog-query-repository.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import {
  FakeAddressStore,
  FakeIdentityStore,
  FakePasswordHasher
} from "../support/fakes.js";
import { FakeBuyerRegistrationStore } from "../support/fake-buyer-registration-store.js";
import { FakeLogisticsStore } from "../support/fake-logistics-store.js";

const PASSWORD = "NexusMarketDemo2026!";
const NOW = "2026-11-05T12:00:00.000Z";

const ADMIN_USER = "90000000-0000-4000-8000-0000000000ad";
const BUYER_USER = "90000000-0000-4000-8000-0000000000b1";
const OPERATOR_A_USER = "91000000-0000-4000-8000-000000000001";
const OPERATOR_B_USER = "91000000-0000-4000-8000-000000000002";
const OPERATOR_A = "81000000-0000-4000-8000-000000000001";
const OPERATOR_B = "81000000-0000-4000-8000-000000000002";
const WAREHOUSE_A = "82000000-0000-4000-8000-000000000001";
const WAREHOUSE_B = "82000000-0000-4000-8000-000000000002";
const PRODUCT_A = "83000000-0000-4000-8000-000000000001";
const PRODUCT_B = "83000000-0000-4000-8000-000000000002";
const ORDER_A = "84000000-0000-4000-8000-000000000001";

class DeterministicTokens implements SessionTokenGenerator {
  private count = 0;

  generate(): { token: string; tokenHash: string } {
    this.count += 1;
    const token = `logistics-token-${this.count}`;
    return { token, tokenHash: hashSessionToken(token) };
  }
}

function profile(
  usuarioId: string,
  operadorId: string,
  overrides: Partial<LogisticsProfileView> = {}
): LogisticsProfileView {
  return {
    id: operadorId,
    usuarioId,
    nombreOperador: `Operador ${operadorId.slice(-1)}`,
    estado: "ACTIVO",
    creadoEn: NOW,
    nombreCompleto: "Operador Demo",
    correoElectronico: `${operadorId.slice(-1)}@nexusmarket.demo`,
    bodegas: [],
    ...overrides
  };
}

function warehouse(
  id: string,
  overrides: Partial<LogisticsWarehouseView> = {}
): LogisticsWarehouseView {
  return {
    id,
    nombre: `Bodega ${id.slice(-1)}`,
    ubicacion: "Bogotá",
    tipo: "VENDEDOR",
    estado: "ACTIVA",
    vendedorId: "85000000-0000-4000-8000-000000000001",
    vendedorNombre: "Aurora",
    ...overrides
  };
}

function reservation(
  id: string,
  productoId: string,
  bodegaId: string,
  cantidad = 2,
  estado: LogisticsReservationView["estado"] = "ACTIVA"
): LogisticsReservationView {
  return {
    id,
    productoId,
    productoNombre: `Producto ${productoId.slice(-1)}`,
    sku: `SKU-${productoId.slice(-1)}`,
    bodegaId,
    bodegaNombre: `Bodega ${bodegaId.slice(-1)}`,
    cantidad,
    estado
  };
}

function order(
  overrides: Partial<LogisticsOrderDetail> = {}
): LogisticsOrderDetail {
  const base: LogisticsOrderDetail = {
    id: ORDER_A,
    numero: "NM-2026-0001",
    estado: "PAGADO",
    estadoPago: "CAPTURADO",
    moneda: "COP",
    totalCentavos: 40000,
    itemsCount: 2,
    creadoEn: NOW,
    vendedorNombre: "Aurora",
    bodegasCount: 1,
    enviosCount: 0,
    reservasActivas: 2,
    direccionEntrega: null,
    items: [
      {
        id: "84000000-0000-4000-8011-000000000001",
        productoId: PRODUCT_A,
        nombreProducto: "Producto 1",
        sku: "SKU-1",
        tipoEntrega: "FISICA",
        cantidad: 2,
        precioUnitarioCentavos: 10000,
        moneda: "COP",
        subtotalCentavos: 20000
      },
      {
        id: "84000000-0000-4000-8011-000000000002",
        productoId: PRODUCT_B,
        nombreProducto: "Producto 2",
        sku: "SKU-2",
        tipoEntrega: "FISICA",
        cantidad: 2,
        precioUnitarioCentavos: 10000,
        moneda: "COP",
        subtotalCentavos: 20000
      }
    ],
    reservas: [
      reservation("84000000-0000-4000-8013-000000000001", PRODUCT_A, WAREHOUSE_A),
      reservation("84000000-0000-4000-8013-000000000002", PRODUCT_B, WAREHOUSE_A)
    ],
    envios: [],
    historial: [
      {
        estadoPrevio: "PENDIENTE_DE_PAGO",
        estadoNuevo: "PAGADO",
        actorId: null,
        actorRol: "COMPRADOR",
        ocurridoEn: NOW,
        referenciaTipo: "PAGO",
        referenciaId: "pago-1",
        correlationId: "corr-pago"
      }
    ]
  };
  return { ...base, ...overrides };
}

interface Harness {
  readonly app: FastifyInstance;
  readonly store: FakeLogisticsStore;
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
      compradorId: "86000000-0000-4000-8000-000000000001"
    },
    {
      usuarioId: OPERATOR_A_USER,
      nombreCompleto: "Operador A",
      correoElectronico: "operador.a@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "OPERADOR_LOGISTICO",
      estado: "ACTIVO"
    },
    {
      usuarioId: OPERATOR_B_USER,
      nombreCompleto: "Operador B",
      correoElectronico: "operador.b@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "OPERADOR_LOGISTICO",
      estado: "ACTIVO"
    }
  ]);

  const store = new FakeLogisticsStore();
  store.seedProfile(profile(OPERATOR_A_USER, OPERATOR_A));
  store.seedProfile(profile(OPERATOR_B_USER, OPERATOR_B));
  store.assignWarehouse(OPERATOR_A, warehouse(WAREHOUSE_A));
  store.assignWarehouse(OPERATOR_B, warehouse(WAREHOUSE_B));
  for (const productoId of [PRODUCT_A, PRODUCT_B]) {
    store.seedInventory({
      productoId,
      productoNombre: `Producto ${productoId.slice(-1)}`,
      sku: `SKU-${productoId.slice(-1)}`,
      bodegaId: WAREHOUSE_A,
      bodegaNombre: "Bodega A",
      onHand: 10,
      reserved: 2,
      unavailable: 0,
      disponible: 8,
      actualizadoEn: NOW
    });
  }
  store.seedOrder(order());

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
      logistics: store
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

async function prepare(
  app: FastifyInstance,
  token: string,
  idempotencyKey = "http-prep-1",
  bodegaId = WAREHOUSE_A
) {
  return app.inject({
    method: "POST",
    url: `/api/v1/logistics/orders/${ORDER_A}/prepare`,
    headers: bearer(token),
    payload: { bodegaId, idempotencyKey }
  });
}

describe("HTTP de la operación logística", () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it("exige autenticación y rol OPERADOR_LOGISTICO", async () => {
    const anonymous = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/profile"
    });
    expect(anonymous.statusCode).toBe(401);

    const buyer = await login(harness.app, "compradora@nexusmarket.demo");
    const asBuyer = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/profile",
      headers: bearer(buyer)
    });
    expect(asBuyer.statusCode).toBe(403);

    const admin = await login(harness.app, "admin@nexusmarket.demo");
    const asAdmin = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/summary",
      headers: bearer(admin)
    });
    expect(asAdmin.statusCode).toBe(403);

    const operator = await login(harness.app, "operador.a@nexusmarket.demo");
    const asOperator = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/profile",
      headers: bearer(operator)
    });
    expect(asOperator.statusCode).toBe(200);
    expect(asOperator.json().data).toMatchObject({
      id: OPERATOR_A,
      usuarioId: OPERATOR_A_USER
    });
  });

  it("expone solo bodegas, inventario y pedidos del ámbito autorizado", async () => {
    const token = await login(harness.app, "operador.a@nexusmarket.demo");
    const headers = bearer(token);

    const warehouses = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/warehouses",
      headers
    });
    expect(warehouses.statusCode).toBe(200);
    expect(warehouses.json().data.map((item: { id: string }) => item.id)).toEqual([
      WAREHOUSE_A
    ]);

    const inventory = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/inventory",
      headers
    });
    expect(inventory.statusCode).toBe(200);
    expect(inventory.json().data).toHaveLength(2);
    expect(
      inventory
        .json()
        .data.every((item: { bodegaId: string }) => item.bodegaId === WAREHOUSE_A)
    ).toBe(true);

    const orders = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/orders?estado=PAGADO",
      headers
    });
    expect(orders.statusCode).toBe(200);
    expect(orders.json().data).toHaveLength(1);
    expect(orders.json().data[0]).toMatchObject({
      id: ORDER_A,
      estado: "PAGADO",
      reservasActivas: 2
    });

    const invalidFilter = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/orders?estado=INVENTADO",
      headers
    });
    expect(invalidFilter.statusCode).toBe(400);

    const other = await login(harness.app, "operador.b@nexusmarket.demo");
    const otherOrders = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/orders",
      headers: bearer(other)
    });
    expect(otherOrders.statusCode).toBe(200);
    expect(otherOrders.json().data).toEqual([]);

    const crossOrder = await harness.app.inject({
      method: "GET",
      url: `/api/v1/logistics/orders/${ORDER_A}`,
      headers: bearer(other)
    });
    expect(crossOrder.statusCode).toBe(404);

    const invalidId = await harness.app.inject({
      method: "GET",
      url: "/api/v1/logistics/orders/no-es-uuid",
      headers
    });
    expect(invalidId.statusCode).toBe(400);
  });

  it("recorre preparación, despacho y entrega con evidencia e idempotencia", async () => {
    const token = await login(harness.app, "operador.a@nexusmarket.demo");
    const headers = bearer(token);

    const prepared = await prepare(harness.app, token);
    expect(prepared.statusCode).toBe(201);
    const shipmentId = prepared.json().data.envio.id as string;
    expect(prepared.json().data.duplicado).toBe(false);
    expect(prepared.json().data.pedido.estado).toBe("EN_PREPARACION");

    const repeatedPrepare = await prepare(harness.app, token);
    expect(repeatedPrepare.statusCode).toBe(200);
    expect(repeatedPrepare.json().data.duplicado).toBe(true);
    expect(repeatedPrepare.json().data.envio.id).toBe(shipmentId);

    const dispatched = await harness.app.inject({
      method: "POST",
      url: `/api/v1/logistics/shipments/${shipmentId}/dispatch`,
      headers,
      payload: { trackingNumber: "TRACK-HTTP-1", idempotencyKey: "http-disp-1" }
    });
    expect(dispatched.statusCode).toBe(201);
    expect(dispatched.json().data.envio.estado).toBe("DESPACHADO");
    expect(dispatched.json().data.movimientoIds).toHaveLength(2);
    expect(dispatched.json().data.pedido.estado).toBe("DESPACHADO");

    const repeatedDispatch = await harness.app.inject({
      method: "POST",
      url: `/api/v1/logistics/shipments/${shipmentId}/dispatch`,
      headers,
      payload: { idempotencyKey: "http-disp-1" }
    });
    expect(repeatedDispatch.statusCode).toBe(200);
    expect(repeatedDispatch.json().data.duplicado).toBe(true);

    const withoutEvidence = await harness.app.inject({
      method: "POST",
      url: `/api/v1/logistics/shipments/${shipmentId}/delivery`,
      headers,
      payload: {
        resultado: "ENTREGADO",
        evidencia: { tipo: "RECIBO" },
        idempotencyKey: "http-del-1"
      }
    });
    expect(withoutEvidence.statusCode).toBe(422);
    expect(withoutEvidence.json().error.detalles.motivo).toBe(
      "EVIDENCIA_REQUERIDA"
    );

    const delivered = await harness.app.inject({
      method: "POST",
      url: `/api/v1/logistics/shipments/${shipmentId}/delivery`,
      headers,
      payload: {
        resultado: "ENTREGADO",
        evidencia: { tipo: "RECIBO", referencia: "REC-HTTP-1" },
        idempotencyKey: "http-del-1"
      }
    });
    expect(delivered.statusCode).toBe(201);
    expect(delivered.json().data.envio.estado).toBe("ENTREGADO");
    expect(delivered.json().data.pedido.estado).toBe("ENTREGADO");

    const detail = await harness.app.inject({
      method: "GET",
      url: `/api/v1/logistics/orders/${ORDER_A}`,
      headers
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().data.estado).toBe("ENTREGADO");
    expect(
      detail
        .json()
        .data.historial.map((entry: { estadoNuevo: string }) => entry.estadoNuevo)
    ).toEqual(["PAGADO", "EN_PREPARACION", "DESPACHADO", "ENTREGADO"]);
  });

  it("rechaza preparar fuera de ámbito, sin reservas o en estado no pagado", async () => {
    const token = await login(harness.app, "operador.a@nexusmarket.demo");

    const outOfScope = await prepare(
      harness.app,
      token,
      "http-prep-otro",
      WAREHOUSE_B
    );
    expect(outOfScope.statusCode).toBe(404);

    harness.store.seedOrder(
      order({
        reservas: [
          reservation(
            "84000000-0000-4000-8013-000000000009",
            PRODUCT_A,
            WAREHOUSE_A,
            2,
            "LIBERADA"
          )
        ]
      })
    );
    const withoutReservations = await prepare(
      harness.app,
      token,
      "http-prep-sin-reservas"
    );
    expect(withoutReservations.statusCode).toBe(422);
    expect(withoutReservations.json().error.detalles.motivo).toBe("SIN_RESERVAS");

    harness.store.seedOrder(order({ estado: "PENDIENTE_DE_PAGO" }));
    const notPaid = await prepare(harness.app, token, "http-prep-no-pagado");
    expect(notPaid.statusCode).toBe(422);
    expect(notPaid.json().error.detalles.motivo).toBe("TRANSICION_INVALIDA");
  });

  it("impide despachar un envío ajeno y registrar una entrega sin despacho", async () => {
    const tokenA = await login(harness.app, "operador.a@nexusmarket.demo");
    const tokenB = await login(harness.app, "operador.b@nexusmarket.demo");
    const prepared = await prepare(harness.app, tokenA, "http-prep-ajeno");
    const shipmentId = prepared.json().data.envio.id as string;

    const crossDispatch = await harness.app.inject({
      method: "POST",
      url: `/api/v1/logistics/shipments/${shipmentId}/dispatch`,
      headers: bearer(tokenB),
      payload: { idempotencyKey: "http-disp-ajeno" }
    });
    expect(crossDispatch.statusCode).toBe(404);

    const earlyDelivery = await harness.app.inject({
      method: "POST",
      url: `/api/v1/logistics/shipments/${shipmentId}/delivery`,
      headers: bearer(tokenA),
      payload: {
        resultado: "ENTREGADO",
        evidencia: { tipo: "RECIBO", referencia: "REC-1" },
        idempotencyKey: "http-del-temprana"
      }
    });
    expect(earlyDelivery.statusCode).toBe(422);
    expect(earlyDelivery.json().error.detalles.motivo).toBe("TRANSICION_INVALIDA");
  });

  it("registra operadores logísticos solo desde un administrador activo", async () => {
    const admin = await login(harness.app, "admin@nexusmarket.demo");
    const payload = {
      nombreCompleto: "Operador Nuevo",
      correoElectronico: "nuevo.operador@nexusmarket.demo",
      documentoIdentidad: { tipo: "CC", pais: "CO", numero: "HTTP-001" },
      credencial: PASSWORD,
      nombreOperador: "Centro HTTP",
      bodegaIds: [WAREHOUSE_A]
    };

    const buyer = await login(harness.app, "compradora@nexusmarket.demo");
    const forbidden = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/logistics-operators",
      headers: bearer(buyer),
      payload
    });
    expect(forbidden.statusCode).toBe(403);

    const created = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/logistics-operators",
      headers: bearer(admin),
      payload
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.bodegas).toEqual([WAREHOUSE_A]);

    const duplicated = await harness.app.inject({
      method: "POST",
      url: "/api/v1/admin/logistics-operators",
      headers: bearer(admin),
      payload: {
        ...payload,
        documentoIdentidad: { tipo: "CC", pais: "CO", numero: "HTTP-002" }
      }
    });
    expect(duplicated.statusCode).toBe(409);
  });

  it("declara 405 para métodos no permitidos en las rutas logísticas", async () => {
    const token = await login(harness.app, "operador.a@nexusmarket.demo");
    const response = await harness.app.inject({
      method: "DELETE",
      url: "/api/v1/logistics/orders",
      headers: bearer(token)
    });
    expect(response.statusCode).toBe(405);
  });
});
