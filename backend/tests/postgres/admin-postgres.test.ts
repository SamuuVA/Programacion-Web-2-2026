import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import { PostgresAdminStore } from "../../src/modules/admin/infrastructure/postgres-admin-store.js";
import { ensureTestSchema, requireTestDatabaseUrl } from "./support.js";

const BASE = Date.parse("2026-11-06T12:00:00.000Z");
const runId = randomUUID().replace(/-/g, "").slice(0, 12);

let pool: Pool;
let store: PostgresAdminStore;

const usuarioIds: string[] = [];
const sellerIds: string[] = [];
const buyerIds: string[] = [];
const warehouseIds: string[] = [];
const productIds: string[] = [];
const checkoutIds: string[] = [];
const orderIds: string[] = [];
const operatorIds: string[] = [];

const ADMIN: AuthenticatedUser = {
  usuarioId: randomUUID(),
  nombreCompleto: "Administradora",
  correoElectronico: "admin@nexusmarket.demo",
  rol: "ADMINISTRADOR",
  estado: "ACTIVO",
  compradorId: null,
  sellerId: null
};

interface Scenario {
  readonly adminUser: string;
  readonly sellerId: string;
  readonly sellerUser: string;
  readonly buyerId: string;
  readonly warehouseId: string;
  readonly productId: string;
  readonly orderId: string;
  readonly paymentId: string;
  readonly movementId: string;
}

function at(offsetSeconds: number): string {
  return new Date(BASE + offsetSeconds * 1000).toISOString();
}

async function insertUser(
  rol: "COMPRADOR" | "VENDEDOR" | "OPERADOR_LOGISTICO" | "ADMINISTRADOR",
  label: string,
  estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO" = "ACTIVO"
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO users (
       id, nombre_completo, correo_normalizado, documento_tipo, documento_pais,
       documento_numero, hash_credencial, rol, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CC', 'CO', $4, 'dummy-hash', $5, $6, $7, $7)`,
    [
      id,
      `Usuario ${label}`,
      `${label}-${runId}@example.test`,
      `DOC-${label}-${runId}`,
      rol,
      estado,
      at(0)
    ]
  );
  usuarioIds.push(id);
  return id;
}

async function seedScenario(): Promise<Scenario> {
  const adminUser = await insertUser("ADMINISTRADOR", `admin-${runId}`);

  const sellerUser = await insertUser("VENDEDOR", `admin-seller-${runId}`);
  const sellerId = randomUUID();
  sellerIds.push(sellerId);
  await pool.query(
    `INSERT INTO sellers (id, usuario_id, nombre_comercial, estado, creado_en)
     VALUES ($1, $2, $3, 'ACTIVO', $4)`,
    [sellerId, sellerUser, `Comercio ${runId}`, at(0)]
  );

  const buyerUser = await insertUser("COMPRADOR", `admin-buyer-${runId}`);
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
     ) VALUES ($1, $2, $3, 'Descripción administrativa', 'ELECTRONICA',
               'PUBLICADO', 'FISICA', $4, 25000, 'COP', $5, $5)`,
    [productId, sellerId, `Producto ${runId}`, `ADM-${runId}`, at(0)]
  );
  await pool.query(
    `INSERT INTO product_images (id, producto_id, url, alt, orden, creado_en)
     VALUES ($1, $2, $3, 'Imagen', 0, $4)`,
    [randomUUID(), productId, `/products/${runId}.svg`, at(0)]
  );
  const inventoryId = randomUUID();
  await pool.query(
    `INSERT INTO inventory (
       id, producto_id, bodega_id, on_hand, reserved, unavailable, version, actualizado_en
     ) VALUES ($1, $2, $3, 10, 2, 1, 1, $4)`,
    [inventoryId, productId, warehouseId, at(0)]
  );

  const movementId = randomUUID();
  await pool.query(
    `INSERT INTO inventory_movements (
       id, inventario_id, producto_id, bodega_id, vendedor_id, tipo, cantidad,
       referencia_tipo, referencia_id, actor_id, motivo, ocurrido_en, idempotency_key
     ) VALUES ($1, $2, $3, $4, $5, 'INGRESO', 10, 'AJUSTE', $6, $7,
               'Carga inicial', $8, $9)`,
    [
      movementId,
      inventoryId,
      productId,
      warehouseId,
      sellerId,
      `ajuste-${runId}`,
      sellerUser,
      at(0),
      `mov-${runId}`
    ]
  );

  const checkoutId = randomUUID();
  checkoutIds.push(checkoutId);
  await pool.query(
    `INSERT INTO checkout_attempts (
       id, comprador_id, idempotency_key, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CONFIRMADO', $4, $4)`,
    [checkoutId, buyerId, `checkout-admin-${runId}`, at(0)]
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
      `NM-ADM-${runId}`,
      JSON.stringify({
        direccionId: randomUUID(),
        destinatario: "Compradora Secreta",
        telefono: "+57 300 000 0000",
        linea1: "Calle Reservada 123",
        linea2: null,
        ciudad: "Bogotá",
        region: "Cundinamarca",
        codigoPostal: "110111",
        pais: "CO",
        capturadaEn: at(0)
      }),
      at(0)
    ]
  );
  await pool.query(
    `INSERT INTO order_items (
       id, pedido_id, producto_id, vendedor_id, nombre_producto, sku,
       tipo_entrega, cantidad, precio_unitario_centavos, moneda, subtotal_centavos
     ) VALUES ($1, $2, $3, $4, $5, $6, 'FISICA', 2, 25000, 'COP', 50000)`,
    [randomUUID(), orderId, productId, sellerId, `Producto ${runId}`, `ADM-${runId}`]
  );
  const paymentId = randomUUID();
  await pool.query(
    `INSERT INTO payments (
       id, pedido_id, estado, proveedor, referencia, monto_centavos, moneda,
       creado_en, actualizado_en
     ) VALUES ($1, $2, 'CAPTURADO', 'SIMULADO', $3, 50000, 'COP', $4, $4)`,
    [paymentId, orderId, `REF-${runId}`, at(0)]
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
    [randomUUID(), orderId, sellerUser, at(1), `envio-${runId}`, `corr-${runId}`]
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
    `admin-operator-${runId}`
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
    adminUser,
    sellerId,
    sellerUser,
    buyerId,
    warehouseId,
    productId,
    orderId,
    paymentId,
    movementId
  };
}

async function cleanup(): Promise<void> {
  if (orderIds.length > 0) {
    await pool.query(
      `DELETE FROM delivery_evidence WHERE envio_id IN (
         SELECT id FROM shipments WHERE pedido_id = ANY($1::uuid[])
       )`,
      [orderIds]
    );
    await pool.query(
      `DELETE FROM shipment_items WHERE envio_id IN (
         SELECT id FROM shipments WHERE pedido_id = ANY($1::uuid[])
       )`,
      [orderIds]
    );
    await pool.query("DELETE FROM shipments WHERE pedido_id = ANY($1::uuid[])", [
      orderIds
    ]);
    await pool.query(
      "DELETE FROM inventory_reservations WHERE pedido_id = ANY($1::uuid[])",
      [orderIds]
    );
    await pool.query(
      "DELETE FROM order_status_history WHERE pedido_id = ANY($1::uuid[])",
      [orderIds]
    );
    await pool.query("DELETE FROM payments WHERE pedido_id = ANY($1::uuid[])", [
      orderIds
    ]);
    await pool.query("DELETE FROM order_items WHERE pedido_id = ANY($1::uuid[])", [
      orderIds
    ]);
    await pool.query("DELETE FROM orders WHERE id = ANY($1::uuid[])", [orderIds]);
  }
  if (productIds.length > 0) {
    await pool.query(
      "DELETE FROM inventory_movements WHERE producto_id = ANY($1::uuid[])",
      [productIds]
    );
    await pool.query("DELETE FROM inventory WHERE producto_id = ANY($1::uuid[])", [
      productIds
    ]);
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
    await pool.query("DELETE FROM products WHERE id = ANY($1::uuid[])", [productIds]);
  }
  if (warehouseIds.length > 0) {
    await pool.query("DELETE FROM warehouses WHERE id = ANY($1::uuid[])", [
      warehouseIds
    ]);
  }
  if (checkoutIds.length > 0) {
    await pool.query("DELETE FROM checkout_attempts WHERE id = ANY($1::uuid[])", [
      checkoutIds
    ]);
  }
  if (sellerIds.length > 0) {
    await pool.query("DELETE FROM sellers WHERE id = ANY($1::uuid[])", [sellerIds]);
  }
  if (buyerIds.length > 0) {
    await pool.query("DELETE FROM buyers WHERE id = ANY($1::uuid[])", [buyerIds]);
  }
  if (usuarioIds.length > 0) {
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [usuarioIds]);
  }
}

describe("Consultas del administrador contra PostgreSQL real", () => {
  beforeAll(async () => {
    const databaseUrl = requireTestDatabaseUrl();
    pool = new Pool({ connectionString: databaseUrl, max: 4 });
    await ensureTestSchema(pool);
    store = new PostgresAdminStore(databaseUrl);
  });

  afterAll(async () => {
    if (!pool) {
      return;
    }
    await store?.close();
    await pool.end();
  });

  it("lee datos reales sin modificar el estado observado", async () => {
    const before = await store.reports();
    const scenario = await seedScenario();
    try {
      const after = await store.reports();
      expect(after.usuarios.total - before.usuarios.total).toBe(4);
      expect(
        after.usuarios.porRol.ADMINISTRADOR - before.usuarios.porRol.ADMINISTRADOR
      ).toBe(1);
      expect(
        after.usuarios.porRol.OPERADOR_LOGISTICO -
          before.usuarios.porRol.OPERADOR_LOGISTICO
      ).toBe(1);
      expect(after.compradores.total - before.compradores.total).toBe(1);
      expect(after.vendedores.total - before.vendedores.total).toBe(1);
      expect(after.operadoresLogisticos.total - before.operadoresLogisticos.total).toBe(1);
      expect(after.bodegas.total - before.bodegas.total).toBe(1);
      expect(after.catalogo.total - before.catalogo.total).toBe(1);
      expect(after.catalogo.porCategoria.ELECTRONICA - before.catalogo.porCategoria.ELECTRONICA).toBe(1);
      expect(after.inventario.onHand - before.inventario.onHand).toBe(10);
      expect(after.inventario.reserved - before.inventario.reserved).toBe(2);
      expect(after.inventario.unavailable - before.inventario.unavailable).toBe(1);
      expect(after.inventario.disponible - before.inventario.disponible).toBe(7);
      expect(after.pedidos.total - before.pedidos.total).toBe(1);
      expect(
        after.pedidos.porEstado.EN_PREPARACION - before.pedidos.porEstado.EN_PREPARACION
      ).toBe(1);
      expect(after.pagos.total - before.pagos.total).toBe(1);
      expect(
        after.pagos.porEstado.CAPTURADO - before.pagos.porEstado.CAPTURADO
      ).toBe(1);
      expect(after.envios.total - before.envios.total).toBe(1);

      const users = await store.listUsers({
        rol: "ADMINISTRADOR",
        estado: "ACTIVO",
        search: `admin-${runId}`,
        page: 1,
        pageSize: 100
      });
      expect(users.items.find((item) => item.id === scenario.adminUser)).toMatchObject({
        rol: "ADMINISTRADOR",
        perfilId: null
      });
      const adminDetail = await store.findUser(scenario.adminUser);
      expect(adminDetail).toMatchObject({ id: scenario.adminUser, perfil: null });

      const buyer = await store.findBuyer(scenario.buyerId);
      expect(buyer).toMatchObject({
        id: scenario.buyerId,
        pedidosCount: 1,
        pedidos: [{ numero: `NM-ADM-${runId}`, totalCentavos: 50000 }]
      });

      const seller = await store.findSeller(scenario.sellerId);
      expect(seller).toMatchObject({
        id: scenario.sellerId,
        productosCount: 1,
        productosPublicadosCount: 1,
        bodegasCount: 1,
        inventarioDisponible: 7,
        inventario: { posiciones: 1, onHand: 10, reserved: 2, unavailable: 1, disponible: 7 }
      });
      expect(seller?.bodegas.find((item) => item.id === scenario.warehouseId)).toMatchObject({
        vendedorNombre: `Comercio ${runId}`,
        productosCount: 1,
        inventarioDisponible: 7
      });

      const warehouse = await store.findWarehouse(scenario.warehouseId);
      expect(warehouse).toMatchObject({
        id: scenario.warehouseId,
        inventario: [{ disponible: 7 }],
        movimientos: [{ id: scenario.movementId, tipo: "INGRESO", cantidad: 10 }],
        operadores: [{ nombreOperador: `Operador ${runId}` }]
      });

      const product = await store.findProduct(scenario.productId);
      expect(product).toMatchObject({
        id: scenario.productId,
        imagenesCount: 1,
        imagenes: [{ orden: 0 }],
        inventario: [{ onHand: 10, reserved: 2, unavailable: 1, disponible: 7 }]
      });

      const inventory = await store.listInventory({
        bodegaId: scenario.warehouseId,
        productoId: null,
        vendedorId: null,
        search: null,
        page: 1,
        pageSize: 100
      });
      expect(inventory.items).toHaveLength(1);
      expect(inventory.items[0]).toMatchObject({ disponible: 7 });

      const movements = await store.listMovements({
        bodegaId: scenario.warehouseId,
        productoId: null,
        page: 1,
        pageSize: 100
      });
      expect(movements.items.find((item) => item.id === scenario.movementId)).toMatchObject({
        tipo: "INGRESO",
        cantidad: 10
      });

      const orders = await store.listOrders({
        estado: "EN_PREPARACION",
        search: `NM-ADM-${runId}`,
        page: 1,
        pageSize: 100
      });
      expect(orders.items.find((item) => item.id === scenario.orderId)).toMatchObject({
        numero: `NM-ADM-${runId}`,
        itemsCount: 1,
        compradorId: scenario.buyerId,
        vendedorId: scenario.sellerId
      });

      const order = await store.findOrder(scenario.orderId);
      expect(order).toMatchObject({
        id: scenario.orderId,
        pago: { estado: "CAPTURADO", montoCentavos: 50000 },
        reservas: [{ estado: "ACTIVA", cantidad: 2 }],
        envios: [{ estado: "PREPARACION", evidencia: { tipo: "FOTO" } }],
        historial: [{ actorRol: "OPERADOR_LOGISTICO" }],
        entrega: { ciudad: "Bogotá", region: "Cundinamarca", pais: "CO" }
      });
      expect(JSON.stringify(order)).not.toContain("Compradora Secreta");
      expect(JSON.stringify(order)).not.toContain("Calle Reservada");
      expect(JSON.stringify(order)).not.toContain("+57 300");

      const payments = await store.listPayments({
        estado: "CAPTURADO",
        search: `NM-ADM-${runId}`,
        page: 1,
        pageSize: 100
      });
      expect(payments.items.find((item) => item.id === scenario.paymentId)).toMatchObject({
        pedidoNumero: `NM-ADM-${runId}`,
        montoCentavos: 50000
      });
      expect(JSON.stringify(payments)).not.toContain(`REF-${runId}`);

      const dashboard = await store.dashboard();
      expect(dashboard.usuarios.total).toBe(after.usuarios.total);
      expect(dashboard.recientes.pedidos.length).toBeLessThanOrEqual(5);
    } finally {
      await cleanup();
    }
  });

  it("el adaptador no contiene sentencias de escritura", async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = await readFile(
      resolve(here, "../../src/modules/admin/infrastructure/postgres-admin-store.ts"),
      "utf8"
    );
    for (const keyword of ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "ALTER"]) {
      expect(source.toUpperCase()).not.toContain(keyword);
    }
  });

  it("el administrador conserva su rol y estado activo", () => {
    expect(ADMIN.rol).toBe("ADMINISTRADOR");
    expect(ADMIN.estado).toBe("ACTIVO");
  });
});
