import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import {
  AuthorizationError,
  BusinessRuleError,
  ResourceNotFoundError,
  UniquenessConflictError
} from "../../src/shared/domain/errors.js";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
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
import { PostgresLogisticsStore } from "../../src/modules/logistics/infrastructure/postgres-logistics-store.js";
import { UuidGenerator } from "../../src/shared/infrastructure/uuid-generator.js";
import { FixedClock } from "../support/doubles.js";
import { FakePasswordHasher } from "../support/fakes.js";
import { ensureTestSchema, requireTestDatabaseUrl } from "./support.js";

const BASE = Date.parse("2026-11-05T12:00:00.000Z");
const runId = randomUUID().replace(/-/g, "").slice(0, 12);

let pool: Pool;
let databaseUrl: string;
let store: PostgresLogisticsStore;
let ids: UuidGenerator;

const usuarioIds: string[] = [];
const sellerIds: string[] = [];
const warehouseIds: string[] = [];
const productIds: string[] = [];
const buyerIds: string[] = [];
const checkoutIds: string[] = [];
const orderIds: string[] = [];
const operatorIds: string[] = [];

interface Scenario {
  readonly sellerId: string;
  readonly buyerId: string;
  readonly operatorAUser: string;
  readonly operatorBUser: string;
  readonly operatorA: string;
  readonly operatorB: string;
  readonly operatorADocument: string;
  readonly warehouseA: string;
  readonly warehouseB: string;
  readonly warehouseInactive: string;
  readonly productA: string;
  readonly productB: string;
  readonly orderA: string;
  readonly checkoutA: string;
}

const ADMIN: AuthenticatedUser = {
  usuarioId: randomUUID(),
  nombreCompleto: "Administradora",
  correoElectronico: "admin@nexusmarket.demo",
  rol: "ADMINISTRADOR",
  estado: "ACTIVO",
  compradorId: null,
  sellerId: null
};

function at(offsetSeconds: number): string {
  return new Date(BASE + offsetSeconds * 1000).toISOString();
}

function resetTrackers(): void {
  usuarioIds.length = 0;
  sellerIds.length = 0;
  warehouseIds.length = 0;
  productIds.length = 0;
  buyerIds.length = 0;
  checkoutIds.length = 0;
  orderIds.length = 0;
  operatorIds.length = 0;
}

async function insertUser(
  rol: "COMPRADOR" | "VENDEDOR" | "OPERADOR_LOGISTICO",
  label: string
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO users (
       id, nombre_completo, correo_normalizado, documento_tipo, documento_pais,
       documento_numero, hash_credencial, rol, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CC', 'CO', $4, 'dummy-hash', $5, 'ACTIVO', $6, $6)`,
    [
      id,
      `Usuario ${label}`,
      `${label}-${runId}@example.test`,
      `DOC-${label}-${runId}`,
      rol,
      at(0)
    ]
  );
  usuarioIds.push(id);
  return id;
}

async function createSeller(label: string): Promise<string> {
  const usuarioId = await insertUser("VENDEDOR", `seller-${label}`);
  const sellerId = randomUUID();
  await pool.query(
    `INSERT INTO sellers (id, usuario_id, nombre_comercial, estado, creado_en)
     VALUES ($1, $2, $3, 'ACTIVO', $4)`,
    [sellerId, usuarioId, `Comercio ${label}`, at(0)]
  );
  sellerIds.push(sellerId);
  return sellerId;
}

async function createWarehouse(
  sellerId: string,
  label: string,
  estado: "ACTIVA" | "INACTIVA" = "ACTIVA"
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO warehouses (id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en)
     VALUES ($1, $2, $3, 'Bogotá', 'VENDEDOR', $4, $5)`,
    [id, sellerId, `Bodega ${label}`, estado, at(0)]
  );
  warehouseIds.push(id);
  return id;
}

async function createProduct(sellerId: string, label: string): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO products (
       id, vendedor_id, nombre, descripcion, categoria, estado, tipo_entrega,
       sku, precio_centavos, moneda, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'Descripción', 'HOGAR', 'PUBLICADO', 'FISICA',
               $4, 10000, 'COP', $5, $5)`,
    [id, sellerId, `Producto ${label}`, `SKU-${label}-${runId}`, at(0)]
  );
  productIds.push(id);
  return id;
}

async function setInventory(
  productoId: string,
  bodegaId: string,
  onHand: number,
  reserved: number
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO inventory (
       id, producto_id, bodega_id, on_hand, reserved, unavailable, version, actualizado_en
     ) VALUES ($1, $2, $3, $4, $5, 0, 1, $6)`,
    [id, productoId, bodegaId, onHand, reserved, at(0)]
  );
  return id;
}

async function createBuyer(label: string): Promise<string> {
  const usuarioId = await insertUser("COMPRADOR", `buyer-${label}`);
  const buyerId = randomUUID();
  await pool.query(
    `INSERT INTO buyers (id, usuario_id, estado_comercial, creado_en)
     VALUES ($1, $2, 'HABILITADO', $3)`,
    [buyerId, usuarioId, at(0)]
  );
  buyerIds.push(buyerId);
  return buyerId;
}

async function createPaidOrder(input: {
  readonly sellerId: string;
  readonly buyerId: string;
  readonly productIds: readonly string[];
  readonly warehouseId: string;
  readonly label: string;
  readonly estado?: "PAGADO" | "PENDIENTE_DE_PAGO";
}): Promise<{ orderId: string; checkoutId: string }> {
  const checkoutId = randomUUID();
  await pool.query(
    `INSERT INTO checkout_attempts (
       id, comprador_id, idempotency_key, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CONFIRMADO', $4, $4)`,
    [checkoutId, input.buyerId, `checkout-${input.label}-${runId}`, at(0)]
  );
  checkoutIds.push(checkoutId);

  const orderId = randomUUID();
  const direccion = {
    direccionId: randomUUID(),
    destinatario: "Compradora Demo",
    telefono: "+57 300 000 0000",
    linea1: "Calle 123 #45-67",
    linea2: null,
    ciudad: "Bogotá",
    region: "Cundinamarca",
    codigoPostal: "110111",
    pais: "CO",
    capturadaEn: at(0)
  };
  await pool.query(
    `INSERT INTO orders (
       id, checkout_id, comprador_id, vendedor_id, numero, estado, estado_pago,
       moneda, total_centavos, direccion_entrega, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, $4, $5, $6, 'CAPTURADO', 'COP', $7, $8::jsonb, $9, $9)`,
    [
      orderId,
      checkoutId,
      input.buyerId,
      input.sellerId,
      `NM-${input.label}-${runId}`,
      input.estado ?? "PAGADO",
      input.productIds.length * 20000,
      JSON.stringify(direccion),
      at(0)
    ]
  );
  orderIds.push(orderId);

  for (const [index, productoId] of input.productIds.entries()) {
    await pool.query(
      `INSERT INTO order_items (
         id, pedido_id, producto_id, vendedor_id, nombre_producto, sku,
         tipo_entrega, cantidad, precio_unitario_centavos, moneda, subtotal_centavos
       ) VALUES ($1, $2, $3, $4, $5, $6, 'FISICA', 2, 10000, 'COP', 20000)`,
      [
        randomUUID(),
        orderId,
        productoId,
        input.sellerId,
        `Producto ${index + 1}`,
        `SKU-ITEM-${index + 1}-${runId}`
      ]
    );
    await pool.query(
      `INSERT INTO inventory_reservations (
         id, checkout_id, pedido_id, producto_id, bodega_id, cantidad, estado, creada_en
       ) VALUES ($1, $2, $3, $4, $5, 2, 'ACTIVA', $6)`,
      [randomUUID(), checkoutId, orderId, productoId, input.warehouseId, at(0)]
    );
  }

  await pool.query(
    `INSERT INTO order_status_history (
       id, pedido_id, estado_previo, estado_nuevo, actor_id, actor_rol,
       ocurrido_en, referencia_tipo, referencia_id, correlation_id
     ) VALUES ($1, $2, 'PENDIENTE_DE_PAGO', 'PAGADO', NULL, 'COMPRADOR',
               $3, 'PAGO', $4, $5)`,
    [
      randomUUID(),
      orderId,
      at(0),
      `pago-${input.label}-${runId}`,
      `corr-${input.label}`
    ]
  );

  return { orderId, checkoutId };
}

async function createOperator(
  usuarioId: string,
  label: string,
  bodegaIds: readonly string[]
): Promise<string> {
  const operadorId = randomUUID();
  await pool.query(
    `INSERT INTO logistics_operators (id, usuario_id, nombre_operador, estado, creado_en)
     VALUES ($1, $2, $3, 'ACTIVO', $4)`,
    [operadorId, usuarioId, `Operador ${label}`, at(0)]
  );
  operatorIds.push(operadorId);
  for (const bodegaId of bodegaIds) {
    await pool.query(
      `INSERT INTO logistics_operator_warehouses (operador_id, bodega_id, asignada_en)
       VALUES ($1, $2, $3)`,
      [operadorId, bodegaId, at(0)]
    );
  }
  return operadorId;
}

async function seedScenario(): Promise<Scenario> {
  const sellerId = await createSeller("aurora");
  const buyerId = await createBuyer("demo");
  const warehouseA = await createWarehouse(sellerId, "A");
  const warehouseB = await createWarehouse(sellerId, "B");
  const warehouseInactive = await createWarehouse(
    sellerId,
    "inactiva",
    "INACTIVA"
  );
  const productA = await createProduct(sellerId, "A");
  const productB = await createProduct(sellerId, "B");

  await setInventory(productA, warehouseA, 10, 2);
  await setInventory(productB, warehouseA, 10, 2);
  await setInventory(productA, warehouseB, 5, 0);

  const { orderId, checkoutId } = await createPaidOrder({
    sellerId,
    buyerId,
    productIds: [productA, productB],
    warehouseId: warehouseA,
    label: "logistica"
  });

  const operatorAUser = await insertUser("OPERADOR_LOGISTICO", "operador-a");
  const operatorBUser = await insertUser("OPERADOR_LOGISTICO", "operador-b");
  const operatorA = await createOperator(operatorAUser, "A", [warehouseA]);
  const operatorB = await createOperator(operatorBUser, "B", [warehouseB]);

  return {
    sellerId,
    buyerId,
    operatorAUser,
    operatorBUser,
    operatorA,
    operatorB,
    operatorADocument: `DOC-operador-a-${runId}`,
    warehouseA,
    warehouseB,
    warehouseInactive,
    productA,
    productB,
    orderA: orderId,
    checkoutA: checkoutId
  };
}

async function cleanup(): Promise<void> {
  if (orderIds.length > 0) {
    await pool.query("DELETE FROM orders WHERE id = ANY($1::uuid[])", [
      orderIds
    ]);
  }
  if (productIds.length > 0) {
    await pool.query(
      "DELETE FROM inventory_movements WHERE producto_id = ANY($1::uuid[])",
      [productIds]
    );
    await pool.query(
      "DELETE FROM inventory WHERE producto_id = ANY($1::uuid[])",
      [productIds]
    );
  }
  if (operatorIds.length > 0 || warehouseIds.length > 0) {
    await pool.query(
      `DELETE FROM logistics_operator_warehouses
        WHERE operador_id = ANY($1::uuid[]) OR bodega_id = ANY($2::uuid[])`,
      [operatorIds, warehouseIds]
    );
    await pool.query(
      "DELETE FROM logistics_operators WHERE id = ANY($1::uuid[])",
      [operatorIds]
    );
  }
  if (productIds.length > 0) {
    await pool.query("DELETE FROM products WHERE id = ANY($1::uuid[])", [
      productIds
    ]);
  }
  if (warehouseIds.length > 0) {
    await pool.query("DELETE FROM warehouses WHERE id = ANY($1::uuid[])", [
      warehouseIds
    ]);
  }
  if (checkoutIds.length > 0) {
    await pool.query(
      "DELETE FROM checkout_attempts WHERE id = ANY($1::uuid[])",
      [checkoutIds]
    );
  }
  if (sellerIds.length > 0) {
    await pool.query("DELETE FROM sellers WHERE id = ANY($1::uuid[])", [
      sellerIds
    ]);
  }
  if (buyerIds.length > 0) {
    await pool.query("DELETE FROM buyers WHERE id = ANY($1::uuid[])", [
      buyerIds
    ]);
  }
  if (usuarioIds.length > 0) {
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
      usuarioIds
    ]);
  }
}

describe("Operación logística contra PostgreSQL real", () => {
  beforeAll(async () => {
    databaseUrl = requireTestDatabaseUrl();
    pool = new Pool({ connectionString: databaseUrl, max: 4 });
    await ensureTestSchema(pool);
    ids = new UuidGenerator();
    store = new PostgresLogisticsStore(databaseUrl, ids);
  });

  afterAll(async () => {
    if (!pool) {
      return;
    }
    await store.close();
    await pool.end();
  });

  let scenario: Scenario;

  beforeEach(async () => {
    resetTrackers();
    scenario = await seedScenario();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("aplica la migración 008 y admite reservas consumidas", async () => {
    for (const table of [
      "logistics_operators",
      "logistics_operator_warehouses",
      "shipments",
      "shipment_items",
      "shipment_events",
      "delivery_evidence",
      "logistics_operations",
      "order_status_history"
    ]) {
      const result = await pool.query<{ tabla: string | null }>(
        `SELECT to_regclass('public.${table}')::text AS tabla`
      );
      expect(result.rows[0]?.tabla, table).toBe(table);
    }

    const column = await pool.query<{ column_name: string }>(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'entregado_en'`
    );
    expect(column.rows).toHaveLength(1);

    const updated = await pool.query<{
      estado: string;
      consumida_en: Date | null;
    }>(
      `UPDATE inventory_reservations
          SET estado = 'CONSUMIDA', consumida_en = $2
        WHERE pedido_id = $1
        RETURNING estado, consumida_en`,
      [scenario.orderA, at(1)]
    );
    expect(updated.rows).toHaveLength(2);
    expect(updated.rows.every((row) => row.estado === "CONSUMIDA")).toBe(true);
    expect(updated.rows.every((row) => row.consumida_en !== null)).toBe(true);
  });

  it("expone solo el perfil, bodegas, inventario y pedidos del ámbito", async () => {
    const profile = await new GetLogisticsProfile(store).execute(
      scenario.operatorAUser
    );
    expect(profile).toMatchObject({
      id: scenario.operatorA,
      usuarioId: scenario.operatorAUser,
      estado: "ACTIVO"
    });
    expect(profile.bodegas.map((item) => item.id)).toEqual([
      scenario.warehouseA
    ]);

    const warehouses = await new ListLogisticsWarehouses(store).execute(
      scenario.operatorAUser
    );
    expect(warehouses.map((item) => item.id)).toEqual([scenario.warehouseA]);

    const inventory = await new ListLogisticsInventory(store).execute(
      scenario.operatorAUser
    );
    expect(inventory).toHaveLength(2);
    expect(
      inventory.every((item) => item.bodegaId === scenario.warehouseA)
    ).toBe(true);
    expect(inventory.map((item) => item.onHand)).toEqual([10, 10]);
    expect(inventory.map((item) => item.reserved)).toEqual([2, 2]);
    expect(inventory.map((item) => item.disponible)).toEqual([8, 8]);

    const orders = await new ListLogisticsOrders(store).execute(
      scenario.operatorAUser,
      null
    );
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: scenario.orderA,
      estado: "PAGADO",
      estadoPago: "CAPTURADO",
      itemsCount: 2,
      bodegasCount: 1,
      enviosCount: 0,
      reservasActivas: 2
    });

    const detail = await new GetLogisticsOrder(store).execute(
      scenario.operatorAUser,
      scenario.orderA
    );
    expect(detail.items).toHaveLength(2);
    expect(detail.reservas).toHaveLength(2);
    expect(detail.envios).toEqual([]);
    expect(detail.historial.map((entry) => entry.estadoNuevo)).toEqual([
      "PAGADO"
    ]);
    expect(detail.direccionEntrega?.ciudad).toBe("Bogotá");

    const summary = await new GetLogisticsSummary(store).execute(
      scenario.operatorAUser
    );
    expect(summary).toEqual({
      pedidosEnPreparacion: 0,
      enviosPorPreparar: 0,
      enviosDespachados: 0,
      enviosEntregados: 0,
      enviosConFallo: 0,
      bodegasAsignadas: 1
    });
  });

  it("recorre preparación, despacho y entrega con evidencia real", async () => {
    const prepare = new PrepareShipment(store, new FixedClock(at(1)));
    const dispatch = new DispatchOrder(store, new FixedClock(at(2)));
    const deliver = new ConfirmDelivery(store, new FixedClock(at(3)));

    const prepared = await prepare.execute(
      scenario.operatorAUser,
      scenario.orderA,
      {
        bodegaId: scenario.warehouseA,
        transportista: "Transportes PostgreSQL",
        idempotencyKey: "pg-prep-1"
      },
      "corr-prep"
    );
    expect(prepared.duplicado).toBe(false);
    expect(prepared.envio.estado).toBe("PREPARACION");
    expect(prepared.envio.transportista).toBe("Transportes PostgreSQL");
    expect(prepared.envio.items).toHaveLength(2);
    expect(prepared.pedido.estado).toBe("EN_PREPARACION");

    const shipmentRow = await pool.query<{
      estado: string;
      despachado_en: Date | null;
    }>("SELECT estado, despachado_en FROM shipments WHERE id = $1", [
      prepared.envio.id
    ]);
    expect(shipmentRow.rows[0]).toMatchObject({ estado: "PREPARACION" });
    expect(shipmentRow.rows[0]?.despachado_en).toBeNull();

    const shipmentItems = await pool.query<{ cantidad: number }>(
      "SELECT cantidad FROM shipment_items WHERE envio_id = $1",
      [prepared.envio.id]
    );
    expect(shipmentItems.rows.map((row) => row.cantidad).sort()).toEqual([
      2, 2
    ]);

    const operation = await pool.query<{ tipo: string }>(
      "SELECT tipo FROM logistics_operations WHERE envio_id = $1",
      [prepared.envio.id]
    );
    expect(operation.rows.map((row) => row.tipo)).toEqual(["PREPARAR"]);

    const afterPrepare = await new GetLogisticsSummary(store).execute(
      scenario.operatorAUser
    );
    expect(afterPrepare.pedidosEnPreparacion).toBe(1);
    expect(afterPrepare.enviosPorPreparar).toBe(1);

    const dispatched = await dispatch.execute(
      scenario.operatorAUser,
      prepared.envio.id,
      {
        trackingNumber: "PG-TRACK-1",
        idempotencyKey: "pg-disp-1"
      },
      "corr-disp"
    );
    expect(dispatched.duplicado).toBe(false);
    expect(dispatched.envio.estado).toBe("DESPACHADO");
    expect(dispatched.envio.trackingNumber).toBe("PG-TRACK-1");
    expect(dispatched.movimientoIds).toHaveLength(2);
    expect(dispatched.pedido.estado).toBe("DESPACHADO");

    const inventory = await pool.query<{ on_hand: number; reserved: number }>(
      `SELECT on_hand, reserved
         FROM inventory
        WHERE bodega_id = $1 AND producto_id = ANY($2::uuid[])
        ORDER BY producto_id`,
      [scenario.warehouseA, [scenario.productA, scenario.productB]]
    );
    expect(inventory.rows.map((row) => row.on_hand)).toEqual([8, 8]);
    expect(inventory.rows.map((row) => row.reserved)).toEqual([0, 0]);

    const reservations = await pool.query<{
      estado: string;
      consumida_en: Date | null;
    }>(
      `SELECT estado, consumida_en
         FROM inventory_reservations
        WHERE pedido_id = $1
        ORDER BY producto_id`,
      [scenario.orderA]
    );
    expect(reservations.rows.map((row) => row.estado)).toEqual([
      "CONSUMIDA",
      "CONSUMIDA"
    ]);
    expect(reservations.rows.every((row) => row.consumida_en !== null)).toBe(
      true
    );

    const movements = await pool.query<{
      tipo: string;
      cantidad: number;
      idempotency_key: string;
    }>(
      `SELECT tipo, cantidad, idempotency_key
         FROM inventory_movements
        WHERE bodega_id = $1
        ORDER BY producto_id`,
      [scenario.warehouseA]
    );
    expect(movements.rows).toHaveLength(2);
    expect(movements.rows.map((row) => row.tipo)).toEqual([
      "SALIDA_VENTA",
      "SALIDA_VENTA"
    ]);
    expect(movements.rows.map((row) => row.cantidad)).toEqual([2, 2]);
    expect(movements.rows.map((row) => row.idempotency_key).sort()).toEqual(
      [
        `pg-disp-1:${scenario.productA}`,
        `pg-disp-1:${scenario.productB}`
      ].sort()
    );

    const orderAfterDispatch = await pool.query<{ estado: string }>(
      "SELECT estado FROM orders WHERE id = $1",
      [scenario.orderA]
    );
    expect(orderAfterDispatch.rows[0]?.estado).toBe("DESPACHADO");

    const afterDispatch = await new GetLogisticsSummary(store).execute(
      scenario.operatorAUser
    );
    expect(afterDispatch.enviosDespachados).toBe(1);
    expect(afterDispatch.pedidosEnPreparacion).toBe(0);

    await expect(
      deliver.execute(
        scenario.operatorAUser,
        prepared.envio.id,
        {
          resultado: "ENTREGADO",
          evidencia: { tipo: "RECIBO" },
          idempotencyKey: "pg-del-sin-referencia"
        },
        "corr-del-error"
      )
    ).rejects.toBeInstanceOf(BusinessRuleError);

    const delivered = await deliver.execute(
      scenario.operatorAUser,
      prepared.envio.id,
      {
        resultado: "ENTREGADO",
        evidencia: {
          tipo: "RECIBO",
          referencia: "REC-PG-1",
          nota: "Entregado en portería"
        },
        idempotencyKey: "pg-del-1"
      },
      "corr-del"
    );
    expect(delivered.duplicado).toBe(false);
    expect(delivered.envio.estado).toBe("ENTREGADO");
    expect(delivered.envio.evidencia).toMatchObject({
      tipo: "RECIBO",
      referencia: "REC-PG-1",
      nota: "Entregado en portería"
    });
    expect(delivered.pedido.estado).toBe("ENTREGADO");

    const evidence = await pool.query<{ tipo: string; referencia: string }>(
      "SELECT tipo, referencia FROM delivery_evidence WHERE envio_id = $1",
      [prepared.envio.id]
    );
    expect(evidence.rows).toEqual([{ tipo: "RECIBO", referencia: "REC-PG-1" }]);

    const orderAfterDelivery = await pool.query<{
      estado: string;
      entregado_en: Date | null;
    }>("SELECT estado, entregado_en FROM orders WHERE id = $1", [
      scenario.orderA
    ]);
    expect(orderAfterDelivery.rows[0]?.estado).toBe("ENTREGADO");
    expect(orderAfterDelivery.rows[0]?.entregado_en).not.toBeNull();

    const history = await pool.query<{ estado_nuevo: string }>(
      `SELECT estado_nuevo
         FROM order_status_history
        WHERE pedido_id = $1
        ORDER BY ocurrido_en ASC, id ASC`,
      [scenario.orderA]
    );
    expect(history.rows.map((row) => row.estado_nuevo)).toEqual([
      "PAGADO",
      "EN_PREPARACION",
      "DESPACHADO",
      "ENTREGADO"
    ]);

    const events = await pool.query<{ estado_nuevo: string }>(
      `SELECT estado_nuevo
         FROM shipment_events
        WHERE envio_id = $1
        ORDER BY ocurrido_en ASC, id ASC`,
      [prepared.envio.id]
    );
    expect(events.rows.map((row) => row.estado_nuevo)).toEqual([
      "PREPARACION",
      "DESPACHADO",
      "ENTREGADO"
    ]);

    const afterDelivery = await new GetLogisticsSummary(store).execute(
      scenario.operatorAUser
    );
    expect(afterDelivery.enviosEntregados).toBe(1);
    expect(afterDelivery.enviosDespachados).toBe(0);
  });

  it("es idempotente y detecta el conflicto de clave con otros datos", async () => {
    const prepare = new PrepareShipment(store, new FixedClock(at(1)));
    const dispatch = new DispatchOrder(store, new FixedClock(at(2)));

    const first = await prepare.execute(
      scenario.operatorAUser,
      scenario.orderA,
      { bodegaId: scenario.warehouseA, idempotencyKey: "pg-idem-prep" },
      "corr-idem"
    );
    const second = await prepare.execute(
      scenario.operatorAUser,
      scenario.orderA,
      { bodegaId: scenario.warehouseA, idempotencyKey: "pg-idem-prep" },
      "corr-idem"
    );
    expect(second.duplicado).toBe(true);
    expect(second.envio.id).toBe(first.envio.id);

    await expect(
      prepare.execute(
        scenario.operatorAUser,
        scenario.orderA,
        { bodegaId: scenario.warehouseB, idempotencyKey: "pg-idem-prep" },
        "corr-idem"
      )
    ).rejects.toMatchObject({ code: "REGLA_NEGOCIO_INCUMPLIDA" });

    const shipmentCount = await pool.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM shipments WHERE pedido_id = $1",
      [scenario.orderA]
    );
    expect(shipmentCount.rows[0]?.total).toBe(1);

    const dispatched = await dispatch.execute(
      scenario.operatorAUser,
      first.envio.id,
      { idempotencyKey: "pg-idem-disp" },
      "corr-idem"
    );
    const repeated = await dispatch.execute(
      scenario.operatorAUser,
      first.envio.id,
      { idempotencyKey: "pg-idem-disp" },
      "corr-idem"
    );
    expect(repeated.duplicado).toBe(true);
    expect(repeated.envio.id).toBe(dispatched.envio.id);

    const movements = await pool.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM inventory_movements WHERE bodega_id = $1",
      [scenario.warehouseA]
    );
    expect(movements.rows[0]?.total).toBe(2);

    const inventory = await pool.query<{ on_hand: number }>(
      `SELECT on_hand FROM inventory
        WHERE bodega_id = $1 AND producto_id = ANY($2::uuid[])
        ORDER BY producto_id`,
      [scenario.warehouseA, [scenario.productA, scenario.productB]]
    );
    expect(inventory.rows.map((row) => row.on_hand)).toEqual([8, 8]);
  });

  it("aísla el ámbito entre operadores y oculta recursos ajenos", async () => {
    const prepare = new PrepareShipment(store, new FixedClock(at(1)));
    const dispatch = new DispatchOrder(store, new FixedClock(at(2)));

    const profileB = await new GetLogisticsProfile(store).execute(
      scenario.operatorBUser
    );
    expect(profileB.bodegas.map((item) => item.id)).toEqual([
      scenario.warehouseB
    ]);

    const inventoryB = await new ListLogisticsInventory(store).execute(
      scenario.operatorBUser
    );
    expect(inventoryB).toHaveLength(1);
    expect(inventoryB[0]?.bodegaId).toBe(scenario.warehouseB);

    expect(
      await new ListLogisticsOrders(store).execute(scenario.operatorBUser, null)
    ).toEqual([]);

    await expect(
      new GetLogisticsOrder(store).execute(
        scenario.operatorBUser,
        scenario.orderA
      )
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await expect(
      prepare.execute(
        scenario.operatorBUser,
        scenario.orderA,
        { bodegaId: scenario.warehouseA, idempotencyKey: "pg-scope-prep" },
        "corr-scope"
      )
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    const prepared = await prepare.execute(
      scenario.operatorAUser,
      scenario.orderA,
      { bodegaId: scenario.warehouseA, idempotencyKey: "pg-scope-a" },
      "corr-scope"
    );

    await expect(
      dispatch.execute(
        scenario.operatorBUser,
        prepared.envio.id,
        { idempotencyKey: "pg-scope-disp" },
        "corr-scope"
      )
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    const summaryB = await new GetLogisticsSummary(store).execute(
      scenario.operatorBUser
    );
    expect(summaryB.bodegasAsignadas).toBe(1);
    expect(summaryB.enviosPorPreparar).toBe(0);
  });

  it("registra operadores logísticos con bodegas activas y valida el alta", async () => {
    const register = new RegisterLogisticsOperator(
      store,
      new FakePasswordHasher(),
      new FixedClock(at(4)),
      ids
    );

    const input = {
      nombreCompleto: "Operador Nuevo",
      correoElectronico: `nuevo-${runId}@nexusmarket.demo`,
      documentoIdentidad: {
        tipo: "CC",
        pais: "CO",
        numero: `NUEVO-${runId}`
      },
      credencial: "NexusMarketDemo2026!",
      nombreOperador: "Centro Logístico Nuevo",
      bodegaIds: [scenario.warehouseB]
    };

    await expect(
      register.execute({ ...ADMIN, rol: "OPERADOR_LOGISTICO" }, input)
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      register.execute(ADMIN, {
        ...input,
        correoElectronico: `inactiva-${runId}@nexusmarket.demo`,
        documentoIdentidad: {
          tipo: "CC",
          pais: "CO",
          numero: `INACTIVA-${runId}`
        },
        bodegaIds: [scenario.warehouseInactive]
      })
    ).rejects.toBeInstanceOf(BusinessRuleError);

    await expect(
      register.execute(ADMIN, {
        ...input,
        correoElectronico: `inexistente-${runId}@nexusmarket.demo`,
        documentoIdentidad: {
          tipo: "CC",
          pais: "CO",
          numero: `INEXISTENTE-${runId}`
        },
        bodegaIds: [randomUUID()]
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    const created = await register.execute(ADMIN, input);
    usuarioIds.push(created.usuarioId);
    operatorIds.push(created.operadorId);
    expect(created.bodegas).toEqual([scenario.warehouseB]);

    const profile = await store.findProfile(created.usuarioId);
    expect(profile).toMatchObject({
      id: created.operadorId,
      nombreOperador: "Centro Logístico Nuevo",
      estado: "ACTIVO"
    });
    expect(profile?.bodegas.map((item) => item.id)).toEqual([
      scenario.warehouseB
    ]);

    await expect(
      register.execute(ADMIN, {
        ...input,
        documentoIdentidad: {
          tipo: "CC",
          pais: "CO",
          numero: `OTRO-${runId}`
        }
      })
    ).rejects.toBeInstanceOf(UniquenessConflictError);

    await expect(
      register.execute(ADMIN, {
        ...input,
        correoElectronico: `documento-${runId}@nexusmarket.demo`,
        documentoIdentidad: {
          tipo: "CC",
          pais: "CO",
          numero: scenario.operatorADocument
        }
      })
    ).rejects.toBeInstanceOf(UniquenessConflictError);
  });
});
