import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  BusinessRuleError,
  ResourceNotFoundError,
  UniquenessConflictError,
  ValidationError
} from "../../src/shared/domain/errors.js";
import {
  assertEnvioEntregable,
  assertEnvioPreparable,
  assertPedidoDespachable,
  assertPedidoPreparable,
  normalizarEvidencia
} from "../../src/modules/logistics/domain/envio.js";
import {
  ConfirmDelivery,
  DispatchOrder,
  GetLogisticsOrder,
  GetLogisticsProfile,
  GetLogisticsSummary,
  ListLogisticsInventory,
  ListLogisticsOrders,
  ListLogisticsWarehouses,
  PrepareShipment,
  RegisterLogisticsOperator
} from "../../src/modules/logistics/application/use-cases.js";
import type {
  LogisticsOrderDetail,
  LogisticsProfileView,
  LogisticsReservationView,
  LogisticsShipmentView,
  LogisticsWarehouseView
} from "../../src/modules/logistics/application/ports.js";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import { FakePasswordHasher } from "../support/fakes.js";
import { FakeLogisticsStore } from "../support/fake-logistics-store.js";

const NOW = "2026-11-05T12:00:00.000Z";
const CORRELATION = "correlation-logistica-1";

const OPERATOR_A_USER = "91000000-0000-4000-8000-000000000001";
const OPERATOR_B_USER = "91000000-0000-4000-8000-000000000002";
const OPERATOR_A = "81000000-0000-4000-8000-000000000001";
const OPERATOR_B = "81000000-0000-4000-8000-000000000002";

const WAREHOUSE_A = "82000000-0000-4000-8000-000000000001";
const WAREHOUSE_B = "82000000-0000-4000-8000-000000000002";
const WAREHOUSE_INACTIVE = "82000000-0000-4000-8000-000000000003";

const PRODUCT_A = "83000000-0000-4000-8000-000000000001";
const PRODUCT_B = "83000000-0000-4000-8000-000000000002";

const ORDER_A = "84000000-0000-4000-8000-000000000001";

const ADMIN: AuthenticatedUser = {
  usuarioId: "90000000-0000-4000-8000-0000000000ad",
  nombreCompleto: "Administradora",
  correoElectronico: "admin@nexusmarket.demo",
  rol: "ADMINISTRADOR",
  estado: "ACTIVO",
  compradorId: null,
  sellerId: null
};

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
      reservation(
        "84000000-0000-4000-8013-000000000001",
        PRODUCT_A,
        WAREHOUSE_A
      ),
      reservation(
        "84000000-0000-4000-8013-000000000002",
        PRODUCT_B,
        WAREHOUSE_A
      )
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
  readonly store: FakeLogisticsStore;
  readonly clock: FixedClock;
  readonly ids: SequentialIds;
}

function createHarness(): Harness {
  const store = new FakeLogisticsStore();
  store.seedProfile(profile(OPERATOR_A_USER, OPERATOR_A));
  store.seedProfile(profile(OPERATOR_B_USER, OPERATOR_B));
  store.assignWarehouse(OPERATOR_A, warehouse(WAREHOUSE_A));
  store.assignWarehouse(OPERATOR_B, warehouse(WAREHOUSE_B));
  store.seedInventory({
    productoId: PRODUCT_A,
    productoNombre: "Producto 1",
    sku: "SKU-1",
    bodegaId: WAREHOUSE_A,
    bodegaNombre: "Bodega A",
    onHand: 10,
    reserved: 2,
    unavailable: 0,
    disponible: 8,
    actualizadoEn: NOW
  });
  store.seedInventory({
    productoId: PRODUCT_B,
    productoNombre: "Producto 2",
    sku: "SKU-2",
    bodegaId: WAREHOUSE_A,
    bodegaNombre: "Bodega A",
    onHand: 10,
    reserved: 2,
    unavailable: 0,
    disponible: 8,
    actualizadoEn: NOW
  });
  store.seedOrder(order());
  return { store, clock: new FixedClock(NOW), ids: new SequentialIds() };
}

describe("dominio logístico", () => {
  it("solo admite preparar y despachar pedidos pagados o en preparación", () => {
    expect(() => assertPedidoPreparable("PAGADO")).not.toThrow();
    expect(() => assertPedidoPreparable("EN_PREPARACION")).not.toThrow();
    expect(() => assertPedidoDespachable("PAGADO")).not.toThrow();
    expect(() => assertPedidoDespachable("EN_PREPARACION")).not.toThrow();

    for (const estado of [
      "PENDIENTE_DE_PAGO",
      "DESPACHADO",
      "ENTREGADO",
      "CANCELADO",
      "CERRADO"
    ]) {
      expect(() => assertPedidoPreparable(estado)).toThrow(BusinessRuleError);
      expect(() => assertPedidoDespachable(estado)).toThrow(BusinessRuleError);
    }
  });

  it("valida los estados del envío antes de despachar y entregar", () => {
    expect(() => assertEnvioPreparable("PREPARACION")).not.toThrow();
    expect(() => assertEnvioPreparable("EMPACADO")).not.toThrow();
    expect(() => assertEnvioPreparable("DESPACHADO")).toThrow(
      BusinessRuleError
    );

    expect(() => assertEnvioEntregable("DESPACHADO")).not.toThrow();
    expect(() => assertEnvioEntregable("EN_TRANSITO")).not.toThrow();
    expect(() => assertEnvioEntregable("PREPARACION")).toThrow(
      BusinessRuleError
    );
    expect(() => assertEnvioEntregable("FALLIDO")).toThrow(BusinessRuleError);
  });

  it("exige evidencia para confirmar la entrega y motivo para el fallo", () => {
    expect(
      normalizarEvidencia("ENTREGADO", {
        tipo: "  RECIBO ",
        referencia: " REC-001 ",
        nota: "  "
      })
    ).toEqual({ tipo: "RECIBO", referencia: "REC-001", nota: null });

    expect(() => normalizarEvidencia("ENTREGADO", { tipo: "RECIBO" })).toThrow(
      BusinessRuleError
    );
    expect(() => normalizarEvidencia("ENTREGADO", {})).toThrow(
      BusinessRuleError
    );

    expect(
      normalizarEvidencia("FALLIDO", { motivo: "Dirección equivocada" })
    ).toEqual({
      tipo: "FALLO_ENTREGA",
      referencia: "Dirección equivocada",
      nota: null
    });
    expect(() => normalizarEvidencia("FALLIDO", {})).toThrow(BusinessRuleError);
  });
});

describe("casos de uso logísticos", () => {
  it("resuelve el perfil activo y rechaza perfiles ausentes o inactivos", async () => {
    const { store } = createHarness();
    const getProfile = new GetLogisticsProfile(store);

    const active = await getProfile.execute(OPERATOR_A_USER);
    expect(active.id).toBe(OPERATOR_A);
    expect(active.bodegas).toEqual([]);

    await expect(getProfile.execute("no-existe")).rejects.toBeInstanceOf(
      AuthorizationError
    );

    const inactiveStore = new FakeLogisticsStore();
    inactiveStore.seedProfile(
      profile(OPERATOR_A_USER, OPERATOR_A, { estado: "INACTIVO" })
    );
    await expect(
      new GetLogisticsProfile(inactiveStore).execute(OPERATOR_A_USER)
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("limita bodegas, inventario y pedidos al ámbito asignado", async () => {
    const { store } = createHarness();

    const warehouses = await new ListLogisticsWarehouses(store).execute(
      OPERATOR_A_USER
    );
    expect(warehouses.map((item) => item.id)).toEqual([WAREHOUSE_A]);

    const inventory = await new ListLogisticsInventory(store).execute(
      OPERATOR_A_USER
    );
    expect(inventory).toHaveLength(2);
    expect(inventory.every((item) => item.bodegaId === WAREHOUSE_A)).toBe(true);

    const orders = await new ListLogisticsOrders(store).execute(
      OPERATOR_A_USER,
      null
    );
    expect(orders.map((item) => item.id)).toEqual([ORDER_A]);

    const otherOrders = await new ListLogisticsOrders(store).execute(
      OPERATOR_B_USER,
      null
    );
    expect(otherOrders).toEqual([]);
  });

  it("filtra pedidos por estado y oculta los ajenos al ámbito", async () => {
    const { store } = createHarness();
    const list = new ListLogisticsOrders(store);
    const getOrder = new GetLogisticsOrder(store);

    expect(await list.execute(OPERATOR_A_USER, "PAGADO")).toHaveLength(1);
    expect(await list.execute(OPERATOR_A_USER, "ENTREGADO")).toEqual([]);

    await expect(
      getOrder.execute(OPERATOR_B_USER, ORDER_A)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      getOrder.execute(OPERATOR_A_USER, "no-es-uuid")
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("prepara un envío desde las reservas activas y es idempotente", async () => {
    const { store, clock } = createHarness();
    const prepare = new PrepareShipment(store, clock);

    const first = await prepare.execute(
      OPERATOR_A_USER,
      ORDER_A,
      {
        bodegaId: WAREHOUSE_A,
        transportista: "  Transportes Uno ",
        idempotencyKey: "prep-1"
      },
      CORRELATION
    );
    expect(first.duplicado).toBe(false);
    expect(first.envio.estado).toBe("PREPARACION");
    expect(first.envio.transportista).toBe("Transportes Uno");
    expect(first.envio.items).toHaveLength(2);
    expect(first.pedido.estado).toBe("EN_PREPARACION");

    const second = await prepare.execute(
      OPERATOR_A_USER,
      ORDER_A,
      { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-1" },
      CORRELATION
    );
    expect(second.duplicado).toBe(true);
    expect(second.envio.id).toBe(first.envio.id);

    await expect(
      prepare.execute(
        OPERATOR_A_USER,
        ORDER_A,
        { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-2" },
        CORRELATION
      )
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it("rechaza preparar sin reservas, fuera de ámbito o con pedido no pagado", async () => {
    const { store, clock } = createHarness();
    const prepare = new PrepareShipment(store, clock);

    await expect(
      prepare.execute(
        OPERATOR_A_USER,
        ORDER_A,
        { bodegaId: WAREHOUSE_B, idempotencyKey: "prep-b" },
        CORRELATION
      )
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    store.seedOrder(
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
    await expect(
      prepare.execute(
        OPERATOR_A_USER,
        ORDER_A,
        { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-sin-reservas" },
        CORRELATION
      )
    ).rejects.toBeInstanceOf(BusinessRuleError);

    store.seedOrder(order({ estado: "PENDIENTE_DE_PAGO" }));
    await expect(
      prepare.execute(
        OPERATOR_A_USER,
        ORDER_A,
        { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-no-pagado" },
        CORRELATION
      )
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it("despacha, consume reservas, descuenta inventario y es idempotente", async () => {
    const { store, clock } = createHarness();
    const prepare = new PrepareShipment(store, clock);
    const dispatch = new DispatchOrder(store, clock);

    const prepared = await prepare.execute(
      OPERATOR_A_USER,
      ORDER_A,
      { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-despacho" },
      CORRELATION
    );

    const dispatched = await dispatch.execute(
      OPERATOR_A_USER,
      prepared.envio.id,
      { trackingNumber: "TRACK-1", idempotencyKey: "disp-1" },
      CORRELATION
    );
    expect(dispatched.duplicado).toBe(false);
    expect(dispatched.envio.estado).toBe("DESPACHADO");
    expect(dispatched.envio.trackingNumber).toBe("TRACK-1");
    expect(dispatched.movimientoIds).toHaveLength(2);
    expect(dispatched.pedido.estado).toBe("DESPACHADO");
    expect(
      dispatched.pedido.reservas.every(
        (reserva) => reserva.estado === "CONSUMIDA"
      )
    ).toBe(true);

    const inventory = await new ListLogisticsInventory(store).execute(
      OPERATOR_A_USER
    );
    expect(inventory.map((item) => item.onHand)).toEqual([8, 8]);
    expect(inventory.map((item) => item.reserved)).toEqual([0, 0]);

    const repeated = await dispatch.execute(
      OPERATOR_A_USER,
      prepared.envio.id,
      { idempotencyKey: "disp-1" },
      CORRELATION
    );
    expect(repeated.duplicado).toBe(true);
    expect(repeated.envio.id).toBe(prepared.envio.id);

    const unchanged = await new ListLogisticsInventory(store).execute(
      OPERATOR_A_USER
    );
    expect(unchanged.map((item) => item.onHand)).toEqual([8, 8]);
  });

  it("rechaza despachar fuera de ámbito o sin inventario suficiente", async () => {
    const { store, clock } = createHarness();
    const prepare = new PrepareShipment(store, clock);
    const dispatch = new DispatchOrder(store, clock);

    const prepared = await prepare.execute(
      OPERATOR_A_USER,
      ORDER_A,
      { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-inventario" },
      CORRELATION
    );

    await expect(
      dispatch.execute(
        OPERATOR_B_USER,
        prepared.envio.id,
        { idempotencyKey: "disp-ajeno" },
        CORRELATION
      )
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    store.seedInventory({
      productoId: PRODUCT_A,
      productoNombre: "Producto 1",
      sku: "SKU-1",
      bodegaId: WAREHOUSE_A,
      bodegaNombre: "Bodega A",
      onHand: 1,
      reserved: 1,
      unavailable: 0,
      disponible: 0,
      actualizadoEn: NOW
    });
    await expect(
      dispatch.execute(
        OPERATOR_A_USER,
        prepared.envio.id,
        { idempotencyKey: "disp-sin-stock" },
        CORRELATION
      )
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it("registra la entrega con evidencia y cierra el pedido solo si todo fue entregado", async () => {
    const { store, clock } = createHarness();
    const prepare = new PrepareShipment(store, clock);
    const dispatch = new DispatchOrder(store, clock);
    const deliver = new ConfirmDelivery(store, clock);

    const prepared = await prepare.execute(
      OPERATOR_A_USER,
      ORDER_A,
      { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-entrega" },
      CORRELATION
    );
    await dispatch.execute(
      OPERATOR_A_USER,
      prepared.envio.id,
      { idempotencyKey: "disp-entrega" },
      CORRELATION
    );

    await expect(
      deliver.execute(
        OPERATOR_A_USER,
        prepared.envio.id,
        {
          resultado: "ENTREGADO",
          evidencia: { tipo: "RECIBO" },
          idempotencyKey: "del-1"
        },
        CORRELATION
      )
    ).rejects.toBeInstanceOf(BusinessRuleError);

    const delivered = await deliver.execute(
      OPERATOR_A_USER,
      prepared.envio.id,
      {
        resultado: "ENTREGADO",
        evidencia: {
          tipo: "RECIBO",
          referencia: "REC-001",
          nota: "Entregado en portería"
        },
        idempotencyKey: "del-1"
      },
      CORRELATION
    );
    expect(delivered.duplicado).toBe(false);
    expect(delivered.envio.estado).toBe("ENTREGADO");
    expect(delivered.envio.evidencia).toMatchObject({
      tipo: "RECIBO",
      referencia: "REC-001",
      nota: "Entregado en portería"
    });
    expect(delivered.pedido.estado).toBe("ENTREGADO");

    const repeated = await deliver.execute(
      OPERATOR_A_USER,
      prepared.envio.id,
      {
        resultado: "ENTREGADO",
        evidencia: { tipo: "RECIBO", referencia: "REC-001" },
        idempotencyKey: "del-1"
      },
      CORRELATION
    );
    expect(repeated.duplicado).toBe(true);
    expect(repeated.envio.id).toBe(prepared.envio.id);
  });

  it("mantiene el pedido despachado cuando la entrega falla", async () => {
    const { store, clock } = createHarness();
    const prepare = new PrepareShipment(store, clock);
    const dispatch = new DispatchOrder(store, clock);
    const deliver = new ConfirmDelivery(store, clock);

    const prepared = await prepare.execute(
      OPERATOR_A_USER,
      ORDER_A,
      { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-fallo" },
      CORRELATION
    );
    await dispatch.execute(
      OPERATOR_A_USER,
      prepared.envio.id,
      { idempotencyKey: "disp-fallo" },
      CORRELATION
    );

    const failed = await deliver.execute(
      OPERATOR_A_USER,
      prepared.envio.id,
      {
        resultado: "FALLIDO",
        evidencia: { motivo: "Destinatario ausente" },
        idempotencyKey: "del-fallo"
      },
      CORRELATION
    );
    expect(failed.envio.estado).toBe("FALLIDO");
    expect(failed.envio.evidencia?.referencia).toBe("Destinatario ausente");
    expect(failed.pedido.estado).toBe("DESPACHADO");

    await expect(
      deliver.execute(
        OPERATOR_A_USER,
        prepared.envio.id,
        {
          resultado: "ENTREGADO",
          evidencia: { tipo: "RECIBO", referencia: "REC-002" },
          idempotencyKey: "del-fallo-2"
        },
        CORRELATION
      )
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it("calcula el resumen solo con envíos y pedidos del ámbito", async () => {
    const { store, clock } = createHarness();
    const prepare = new PrepareShipment(store, clock);
    const summary = new GetLogisticsSummary(store);

    const before = await summary.execute(OPERATOR_A_USER);
    expect(before).toEqual({
      pedidosEnPreparacion: 0,
      enviosPorPreparar: 0,
      enviosDespachados: 0,
      enviosEntregados: 0,
      enviosConFallo: 0,
      bodegasAsignadas: 1
    });

    await prepare.execute(
      OPERATOR_A_USER,
      ORDER_A,
      { bodegaId: WAREHOUSE_A, idempotencyKey: "prep-resumen" },
      CORRELATION
    );
    const after = await summary.execute(OPERATOR_A_USER);
    expect(after.pedidosEnPreparacion).toBe(1);
    expect(after.enviosPorPreparar).toBe(1);

    const other = await summary.execute(OPERATOR_B_USER);
    expect(other.pedidosEnPreparacion).toBe(0);
    expect(other.bodegasAsignadas).toBe(1);
  });

  it("registra operadores solo desde un administrador activo y con bodegas válidas", async () => {
    const { store, clock, ids } = createHarness();
    store.assignWarehouse(
      "seed",
      warehouse(WAREHOUSE_INACTIVE, { estado: "INACTIVA" })
    );
    const register = new RegisterLogisticsOperator(
      store,
      new FakePasswordHasher(),
      clock,
      ids
    );

    const input = {
      nombreCompleto: "Operador Nuevo",
      correoElectronico: "nuevo@nexusmarket.demo",
      documentoIdentidad: { tipo: "CC", pais: "CO", numero: "123456" },
      credencial: "NexusMarketDemo2026!",
      nombreOperador: "Centro Nuevo",
      bodegaIds: [WAREHOUSE_A]
    };

    await expect(
      register.execute({ ...ADMIN, rol: "COMPRADOR" }, input)
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      register.execute(ADMIN, { ...input, bodegaIds: [] })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      register.execute(ADMIN, { ...input, credencial: "corta" })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      register.execute(ADMIN, { ...input, bodegaIds: [WAREHOUSE_INACTIVE] })
    ).rejects.toBeInstanceOf(BusinessRuleError);

    const created = await register.execute(ADMIN, input);
    expect(created.operadorId).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.bodegas).toEqual([WAREHOUSE_A]);

    await expect(
      register.execute(ADMIN, {
        ...input,
        documentoIdentidad: { tipo: "CC", pais: "CO", numero: "999999" }
      })
    ).rejects.toBeInstanceOf(UniquenessConflictError);
  });
});

// Tipos auxiliares usados por los helpers para evitar duplicar literales.
export type { LogisticsShipmentView };
