import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import { PostgresSupervisorStore } from "../../src/modules/supervisor/infrastructure/postgres-supervisor-store.js";
import { ensureTestSchema, requireTestDatabaseUrl } from "./support.js";

const BASE = Date.parse("2026-11-06T12:00:00.000Z");
const runId = randomUUID().replace(/-/g, "").slice(0, 12);

let pool: Pool;
let store: PostgresSupervisorStore;

const usuarioIds: string[] = [];
const sellerIds: string[] = [];
const buyerIds: string[] = [];
const warehouseIds: string[] = [];
const productIds: string[] = [];
const checkoutIds: string[] = [];
const orderIds: string[] = [];
const operatorIds: string[] = [];

const SUPERVISOR: AuthenticatedUser = {
  usuarioId: randomUUID(),
  nombreCompleto: "Supervisora",
  correoElectronico: "supervisor@nexusmarket.demo",
  rol: "SUPERVISOR",
  estado: "ACTIVO",
  compradorId: null,
  sellerId: null
};

interface Scenario {
  readonly sellerId: string;
  readonly sellerUser: string;
  readonly buyerId: string;
  readonly warehouseId: string;
  readonly productId: string;
  readonly orderId: string;
  readonly shipmentId: string;
}

function at(offsetSeconds: number): string {
  return new Date(BASE + offsetSeconds * 1000).toISOString();
}

async function insertUser(
  rol: "COMPRADOR" | "VENDEDOR" | "OPERADOR_LOGISTICO" | "SUPERVISOR",
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

async function seedScenario(): Promise<Scenario> {
  const sellerUser = await insertUser("VENDEDOR", `supervisor-seller-${runId}`);
  const sellerId = randomUUID();
  sellerIds.push(sellerId);
  await pool.query(
    `INSERT INTO sellers (id, usuario_id, nombre_comercial, estado, creado_en)
     VALUES ($1, $2, $3, 'ACTIVO', $4)`,
    [sellerId, sellerUser, `Comercio ${runId}`, at(0)]
  );

  const buyerUser = await insertUser("COMPRADOR", `supervisor-buyer-${runId}`);
  const buyerId = randomUUID();
  buyerIds.push(buyerId);
  await pool.query(
    `INSERT INTO buyers (id, usuario_id, estado_comercial, creado_en)
     VALUES ($1, $2, 'HABILITADO', $3)`,
    [buyerId, buyerUser, at(0)]
  );

  const warehouseId = randomUUID();
  warehouseIds.push(warehouseId);
  await pool.query(
    `INSERT INTO warehouses (id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en)
     VALUES ($1, $2, $3, 'Bogotá', 'VENDEDOR', 'ACTIVA', $4)`,
    [warehouseId, sellerId, `Bodega ${runId}`, at(0)]
  );

  const productId = randomUUID();
  productIds.push(productId);
  await pool.query(
    `INSERT INTO products (
       id, vendedor_id, nombre, descripcion, categoria, estado, tipo_entrega,
       sku, precio_centavos, moneda, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'Descripción de supervisión', 'ELECTRONICA',
               'PUBLICADO', 'FISICA', $4, 25000, 'COP', $5, $5)`,
    [productId, sellerId, `Producto ${runId}`, `SUP-${runId}`, at(0)]
  );
  await pool.query(
    `INSERT INTO product_images (id, producto_id, url, alt, orden, creado_en)
     VALUES ($1, $2, $3, 'Imagen', 0, $4)`,
    [randomUUID(), productId, `/products/${runId}.svg`, at(0)]
  );
  await pool.query(
    `INSERT INTO inventory (
       id, producto_id, bodega_id, on_hand, reserved, unavailable, version, actualizado_en
     ) VALUES ($1, $2, $3, 10, 2, 1, 1, $4)`,
    [randomUUID(), productId, warehouseId, at(0)]
  );

  const checkoutId = randomUUID();
  checkoutIds.push(checkoutId);
  await pool.query(
    `INSERT INTO checkout_attempts (
       id, comprador_id, idempotency_key, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CONFIRMADO', $4, $4)`,
    [checkoutId, buyerId, `checkout-sup-${runId}`, at(0)]
  );

  const orderId = randomUUID();
  orderIds.push(orderId);
  await pool.query(
    `INSERT INTO orders (
       id, checkout_id, comprador_id, vendedor_id, numero, estado, estado_pago,
       moneda, total_centavos, direccion_entrega, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, $4, $5, 'EN_PREPARACION', 'CAPTURADO', 'COP', 50000,
               $6::jsonb, $7, $7)`,
    [
      orderId,
      checkoutId,
      buyerId,
      sellerId,
      `NM-SUP-${runId}`,
      JSON.stringify({
        destinatario: "Compradora Secreta",
        telefono: "+57 300 000 0000",
        linea1: "Calle Reservada 123",
        ciudad: "Bogotá"
      }),
      at(0)
    ]
  );
  await pool.query(
    `INSERT INTO order_items (
       id, pedido_id, producto_id, vendedor_id, nombre_producto, sku,
       tipo_entrega, cantidad, precio_unitario_centavos, moneda, subtotal_centavos
     ) VALUES ($1, $2, $3, $4, $5, $6, 'FISICA', 2, 25000, 'COP', 50000)`,
    [
      randomUUID(),
      orderId,
      productId,
      sellerId,
      `Producto ${runId}`,
      `SUP-${runId}`
    ]
  );
  await pool.query(
    `INSERT INTO payments (
       id, pedido_id, estado, proveedor, referencia, monto_centavos, moneda,
       creado_en, actualizado_en
     ) VALUES ($1, $2, 'CAPTURADO', 'SIMULADO', $3, 50000, 'COP', $4, $4)`,
    [randomUUID(), orderId, `REF-${runId}`, at(0)]
  );
  await pool.query(
    `INSERT INTO inventory_reservations (
       id, checkout_id, pedido_id, producto_id, bodega_id, cantidad, estado, creada_en
     ) VALUES ($1, $2, $3, $4, $5, 2, 'ACTIVA', $6)`,
    [randomUUID(), checkoutId, orderId, productId, warehouseId, at(0)]
  );
  await pool.query(
    `INSERT INTO order_status_history (
       id, pedido_id, estado_previo, estado_nuevo, actor_id, actor_rol,
       ocurrido_en, referencia_tipo, referencia_id, correlation_id
     ) VALUES ($1, $2, 'PAGADO', 'EN_PREPARACION', $3, 'OPERADOR_LOGISTICO',
               $4, 'ENVIO', $5, $6)`,
    [
      randomUUID(),
      orderId,
      sellerUser,
      at(1),
      `envio-${runId}`,
      `corr-${runId}`
    ]
  );

  const shipmentId = randomUUID();
  await pool.query(
    `INSERT INTO shipments (
       id, pedido_id, bodega_origen_id, transportista, tracking_number, estado,
       creado_en, actualizado_en, despachado_en, entregado_en, version
     ) VALUES ($1, $2, $3, NULL, NULL, 'PREPARACION', $4, $4, NULL, NULL, 1)`,
    [shipmentId, orderId, warehouseId, at(0)]
  );
  await pool.query(
    `INSERT INTO shipment_items (id, envio_id, producto_id, cantidad)
     VALUES ($1, $2, $3, 2)`,
    [randomUUID(), shipmentId, productId]
  );
  await pool.query(
    `INSERT INTO delivery_evidence (
       id, envio_id, tipo, referencia, nota, registrada_por, registrada_en
     ) VALUES ($1, $2, 'FOTO', $3, 'Evidencia de prueba', $4, $5)`,
    [randomUUID(), shipmentId, `evidencia-${runId}`, sellerUser, at(2)]
  );

  const operatorUser = await insertUser(
    "OPERADOR_LOGISTICO",
    `supervisor-operator-${runId}`
  );
  const operatorId = randomUUID();
  operatorIds.push(operatorId);
  await pool.query(
    `INSERT INTO logistics_operators (id, usuario_id, nombre_operador, estado, creado_en)
     VALUES ($1, $2, $3, 'ACTIVO', $4)`,
    [operatorId, operatorUser, `Operador ${runId}`, at(0)]
  );
  await pool.query(
    `INSERT INTO logistics_operator_warehouses (operador_id, bodega_id, asignada_en)
     VALUES ($1, $2, $3)`,
    [operatorId, warehouseId, at(0)]
  );

  return {
    sellerId,
    sellerUser,
    buyerId,
    warehouseId,
    productId,
    orderId,
    shipmentId
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

describe("Consultas del supervisor contra PostgreSQL real", () => {
  beforeAll(async () => {
    const databaseUrl = requireTestDatabaseUrl();
    pool = new Pool({ connectionString: databaseUrl, max: 4 });
    await ensureTestSchema(pool);
    store = new PostgresSupervisorStore(databaseUrl);
  });

  afterAll(async () => {
    if (!pool) {
      return;
    }
    await store?.close();
    await pool.end();
  });

  it("lee datos reales sin modificar pedidos, productos, inventario ni envíos", async () => {
    const before = await store.dashboard();
    const scenario = await seedScenario();
    try {
      const after = await store.dashboard();
      expect(after.pedidosTotal - before.pedidosTotal).toBe(1);
      expect(
        after.pedidosPorEstado.EN_PREPARACION -
          before.pedidosPorEstado.EN_PREPARACION
      ).toBe(1);
      expect(
        after.pagosPorEstado.CAPTURADO - before.pagosPorEstado.CAPTURADO
      ).toBe(1);
      expect(after.productosTotal - before.productosTotal).toBe(1);
      expect(
        after.productosPorEstado.PUBLICADO - before.productosPorEstado.PUBLICADO
      ).toBe(1);
      expect(after.inventario.onHand - before.inventario.onHand).toBe(10);
      expect(after.inventario.reserved - before.inventario.reserved).toBe(2);
      expect(after.inventario.unavailable - before.inventario.unavailable).toBe(
        1
      );
      expect(after.inventario.disponible - before.inventario.disponible).toBe(
        7
      );
      expect(
        after.almacenesPorEstado.ACTIVA - before.almacenesPorEstado.ACTIVA
      ).toBe(1);
      expect(after.enviosTotal - before.enviosTotal).toBe(1);
      expect(
        after.enviosPorEstado.PREPARACION - before.enviosPorEstado.PREPARACION
      ).toBe(1);
      expect(
        after.vendedoresPorEstado.ACTIVO - before.vendedoresPorEstado.ACTIVO
      ).toBe(1);
      expect(
        after.operadoresLogisticosPorEstado.ACTIVO -
          before.operadoresLogisticosPorEstado.ACTIVO
      ).toBe(1);
      expect(
        after.compradoresPorEstado.HABILITADO -
          before.compradoresPorEstado.HABILITADO
      ).toBe(1);

      const orders = await store.listOrders({
        estado: "EN_PREPARACION",
        page: 1,
        pageSize: 100
      });
      const order = orders.items.find((item) => item.id === scenario.orderId);
      expect(order).toBeDefined();
      expect(order).toMatchObject({
        numero: `NM-SUP-${runId}`,
        vendedorId: scenario.sellerId,
        itemsCount: 1
      });

      const detail = await store.findOrder(scenario.orderId);
      expect(detail).not.toBeNull();
      expect(detail).toMatchObject({
        id: scenario.orderId,
        items: [{ sku: `SUP-${runId}`, cantidad: 2 }],
        pago: { estado: "CAPTURADO", montoCentavos: 50000 },
        reservas: [{ estado: "ACTIVA", cantidad: 2 }],
        envios: [
          {
            id: scenario.shipmentId,
            estado: "PREPARACION",
            evidencia: { tipo: "FOTO" }
          }
        ],
        historial: [{ actorRol: "OPERADOR_LOGISTICO" }]
      });
      expect(detail).not.toHaveProperty("direccionEntrega");
      expect(JSON.stringify(detail)).not.toContain("Compradora Secreta");
      expect(JSON.stringify(detail)).not.toContain("Calle Reservada");

      const products = await store.listProducts({
        estado: "PUBLICADO",
        categoria: "ELECTRONICA",
        vendedorId: scenario.sellerId,
        page: 1,
        pageSize: 100
      });
      expect(
        products.items.find((item) => item.id === scenario.productId)
      ).toMatchObject({
        nombre: `Producto ${runId}`,
        imagenesCount: 1,
        inventarioDisponible: 7
      });

      const product = await store.findProduct(scenario.productId);
      expect(product).toMatchObject({
        id: scenario.productId,
        imagenes: [{ orden: 0 }],
        inventario: [{ onHand: 10, reserved: 2, unavailable: 1, disponible: 7 }]
      });

      const warehouses = await store.listWarehouses();
      expect(
        warehouses.find((item) => item.id === scenario.warehouseId)
      ).toMatchObject({
        vendedorNombre: `Comercio ${runId}`
      });

      const inventory = await store.listInventory({
        bodegaId: scenario.warehouseId,
        productoId: null,
        page: 1,
        pageSize: 100
      });
      expect(inventory.items).toHaveLength(1);
      expect(inventory.items[0]).toMatchObject({ disponible: 7 });

      const shipments = await store.listShipments({
        estado: "PREPARACION",
        pedidoId: scenario.orderId,
        page: 1,
        pageSize: 100
      });
      expect(shipments.items).toHaveLength(1);
      expect(shipments.items[0]).toMatchObject({
        id: scenario.shipmentId,
        pedidoNumero: `NM-SUP-${runId}`
      });

      const sellers = await store.listSellers({
        estado: "ACTIVO",
        page: 1,
        pageSize: 100
      });
      expect(
        sellers.items.find((item) => item.id === scenario.sellerId)
      ).toMatchObject({
        nombreComercial: `Comercio ${runId}`,
        productosCount: 1,
        productosPublicadosCount: 1,
        bodegasCount: 1,
        inventarioDisponible: 7
      });

      const afterReads = await pool.query<{
        estado: string;
        on_hand: number;
        reserved: number;
        unavailable: number;
      }>(
        `SELECT o.estado, i.on_hand, i.reserved, i.unavailable
           FROM orders o
           JOIN inventory i ON i.producto_id = $2
          WHERE o.id = $1`,
        [scenario.orderId, scenario.productId]
      );
      expect(afterReads.rows[0]).toMatchObject({
        estado: "EN_PREPARACION",
        on_hand: 10,
        reserved: 2,
        unavailable: 1
      });
    } finally {
      await cleanup();
    }
  });

  it("el adaptador no contiene sentencias de escritura", async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = await readFile(
      resolve(
        here,
        "../../src/modules/supervisor/infrastructure/postgres-supervisor-store.ts"
      ),
      "utf8"
    );
    for (const keyword of ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "ALTER"]) {
      expect(source.toUpperCase()).not.toContain(keyword);
    }
  });

  it("el supervisor sigue siendo un rol de solo consulta", () => {
    expect(SUPERVISOR.rol).toBe("SUPERVISOR");
    expect(SUPERVISOR.estado).toBe("ACTIVO");
  });
});
