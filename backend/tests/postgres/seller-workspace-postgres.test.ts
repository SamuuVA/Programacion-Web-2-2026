import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AddSellerProductImage,
  CreateSellerProduct,
  CreateSellerWarehouse,
  GetSellerOrder,
  GetSellerProduct,
  ListSellerOrders,
  PublishSellerProduct,
  RegisterInventoryIngress,
  UpdateSellerProduct
} from "../../src/modules/seller-workspace/application/use-cases.js";
import { PostgresSellerWorkspaceStore } from "../../src/modules/seller-workspace/infrastructure/postgres-seller-workspace-store.js";
import { UuidGenerator } from "../../src/shared/infrastructure/uuid-generator.js";
import { FixedClock } from "../support/doubles.js";
import { ensureTestSchema, requireTestDatabaseUrl } from "./support.js";

const NOW = "2026-11-03T12:00:00.000Z";
const runId = randomUUID().replace(/-/g, "").slice(0, 12);

let pool: Pool;
let databaseUrl: string;
let store: PostgresSellerWorkspaceStore;

const usuarioIds: string[] = [];
const sellerIds: string[] = [];
const warehouseIds: string[] = [];
const productIds: string[] = [];
const buyerIds: string[] = [];
const checkoutIds: string[] = [];
const orderIds: string[] = [];

interface SellerFixture {
  readonly usuarioId: string;
  readonly sellerId: string;
}

interface OrderFixture {
  readonly orderId: string;
  readonly buyerId: string;
}

async function insertUser(
  id: string,
  rol: "COMPRADOR" | "VENDEDOR",
  label: string
): Promise<void> {
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
      NOW
    ]
  );
  usuarioIds.push(id);
}

async function createSeller(
  label: string,
  estado: "ACTIVO" | "SUSPENDIDO" = "ACTIVO"
): Promise<SellerFixture> {
  const usuarioId = randomUUID();
  const sellerId = randomUUID();
  await insertUser(usuarioId, "VENDEDOR", label);
  await pool.query(
    `INSERT INTO sellers (id, usuario_id, nombre_comercial, estado, creado_en)
     VALUES ($1, $2, $3, $4, $5)`,
    [sellerId, usuarioId, `Comercio ${label}`, estado, NOW]
  );
  sellerIds.push(sellerId);
  return { usuarioId, sellerId };
}

async function createWarehouse(
  sellerId: string,
  label: string,
  estado: "ACTIVA" | "INACTIVA" = "ACTIVA"
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO warehouses (
       id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en
     ) VALUES ($1, $2, $3, 'Bogotá', 'VENDEDOR', $4, $5)`,
    [id, sellerId, `Bodega ${label}`, estado, NOW]
  );
  warehouseIds.push(id);
  return id;
}

async function insertProduct(
  sellerId: string,
  sku: string,
  options: {
    readonly estado?: "BORRADOR" | "PUBLICADO" | "SUSPENDIDO" | "DESCONTINUADO";
    readonly tipoEntrega?: "FISICA" | "DIGITAL";
  } = {}
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO products (
       id, vendedor_id, nombre, descripcion, categoria, estado, tipo_entrega,
       sku, precio_centavos, moneda, creado_en, actualizado_en
     ) VALUES ($1, $2, 'Producto existente', 'Descripción', 'HOGAR', $3, $4, $5, 10000, 'COP', $6, $6)`,
    [id, sellerId, options.estado ?? "BORRADOR", options.tipoEntrega ?? "FISICA", sku, NOW]
  );
  productIds.push(id);
  return id;
}

async function createOrder(
  sellerId: string,
  productId: string,
  label: string
): Promise<OrderFixture> {
  const buyerUserId = randomUUID();
  const buyerId = randomUUID();
  const checkoutId = randomUUID();
  const orderId = randomUUID();

  await insertUser(buyerUserId, "COMPRADOR", `buyer-${label}`);
  await pool.query(
    `INSERT INTO buyers (id, usuario_id, estado_comercial, creado_en)
     VALUES ($1, $2, 'HABILITADO', $3)`,
    [buyerId, buyerUserId, NOW]
  );
  buyerIds.push(buyerId);

  await pool.query(
    `INSERT INTO checkout_attempts (
       id, comprador_id, idempotency_key, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CONFIRMADO', $4, $4)`,
    [checkoutId, buyerId, `checkout-${label}-${runId}`, NOW]
  );
  checkoutIds.push(checkoutId);

  await pool.query(
    `INSERT INTO orders (
       id, checkout_id, comprador_id, vendedor_id, numero, estado, estado_pago,
       moneda, total_centavos, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, $4, $5, 'PAGADO', 'CAPTURADO', 'COP', 10000, $6, $6)`,
    [orderId, checkoutId, buyerId, sellerId, `NM-${label}-${runId}`, NOW]
  );
  orderIds.push(orderId);

  await pool.query(
    `INSERT INTO order_items (
       id, pedido_id, producto_id, vendedor_id, nombre_producto, sku,
       tipo_entrega, cantidad, precio_unitario_centavos, moneda,
       subtotal_centavos
     ) VALUES ($1, $2, $3, $4, 'Producto', 'SKU-ORDER', 'FISICA', 1, 10000, 'COP', 10000)`,
    [randomUUID(), orderId, productId, sellerId]
  );

  return { orderId, buyerId };
}

describe("Espacio del vendedor contra PostgreSQL real", () => {
  beforeAll(async () => {
    databaseUrl = requireTestDatabaseUrl();
    pool = new Pool({ connectionString: databaseUrl, max: 4 });
    await ensureTestSchema(pool);
    store = new PostgresSellerWorkspaceStore(databaseUrl);
  });

  afterAll(async () => {
    if (!pool) {
      return;
    }
    try {
      await pool.query("DELETE FROM order_items WHERE pedido_id = ANY($1::uuid[])", [
        orderIds
      ]);
      await pool.query("DELETE FROM orders WHERE id = ANY($1::uuid[])", [orderIds]);
      await pool.query(
        "DELETE FROM checkout_attempts WHERE id = ANY($1::uuid[])",
        [checkoutIds]
      );
      await pool.query(
        "DELETE FROM inventory_movements WHERE producto_id = ANY($1::uuid[])",
        [productIds]
      );
      await pool.query("DELETE FROM inventory WHERE producto_id = ANY($1::uuid[])", [
        productIds
      ]);
      await pool.query(
        "DELETE FROM product_images WHERE producto_id = ANY($1::uuid[])",
        [productIds]
      );
      await pool.query("DELETE FROM products WHERE id = ANY($1::uuid[])", [productIds]);
      await pool.query("DELETE FROM warehouses WHERE id = ANY($1::uuid[])", [
        warehouseIds
      ]);
      await pool.query("DELETE FROM sellers WHERE id = ANY($1::uuid[])", [sellerIds]);
      await pool.query("DELETE FROM buyers WHERE id = ANY($1::uuid[])", [buyerIds]);
      await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [usuarioIds]);
    } finally {
      await store.close();
      await pool.end();
    }
  });

  it("aplica la migración 007 y crea productos en BORRADOR", async () => {
    const migration = await pool.query<{ tabla: string | null }>(
      "SELECT to_regclass('public.inventory_movements')::text AS tabla"
    );
    expect(migration.rows[0]?.tabla).toBe("inventory_movements");

    const seller = await createSeller("migracion");
    const actor = { usuarioId: seller.usuarioId, sellerId: seller.sellerId };
    const ids = new UuidGenerator();
    const create = new CreateSellerProduct(store, new FixedClock(NOW), ids);

    const product = await create.execute(actor, {
      datos: {
        nombre: "Producto nuevo",
        descripcion: "Descripción",
        categoria: "HOGAR",
        tipoEntrega: "FISICA",
        sku: `MIG-${runId}`,
        precioCentavos: 12000,
        moneda: "COP"
      }
    });
    productIds.push(product.id);

    expect(product.estado).toBe("BORRADOR");
    const row = await pool.query<{ estado: string }>(
      "SELECT estado FROM products WHERE id = $1",
      [product.id]
    );
    expect(row.rows[0]?.estado).toBe("BORRADOR");

    await expect(
      pool.query("UPDATE products SET estado = 'INVALIDO' WHERE id = $1", [product.id])
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("publica solo con imagen y no reactiva un producto descontinuado", async () => {
    const seller = await createSeller("publicacion");
    const actor = { usuarioId: seller.usuarioId, sellerId: seller.sellerId };
    const clock = new FixedClock(NOW);
    const ids = new UuidGenerator();
    const create = new CreateSellerProduct(store, clock, ids);
    const addImage = new AddSellerProductImage(store, clock, ids);
    const publish = new PublishSellerProduct(store, clock);

    const product = await create.execute(actor, {
      datos: {
        nombre: "Lámpara",
        descripcion: "Lámpara de mesa",
        categoria: "HOGAR",
        tipoEntrega: "FISICA",
        sku: `PUB-${runId}`,
        precioCentavos: 55000,
        moneda: "COP"
      }
    });
    productIds.push(product.id);

    await expect(publish.execute(actor, product.id)).rejects.toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: expect.objectContaining({ motivo: "PRODUCTO_NO_PUBLICABLE" })
    });

    await addImage.execute(actor, product.id, {
      url: "/products/lampara.svg",
      alt: "Lámpara"
    });
    const published = await publish.execute(actor, product.id);
    expect(published.estado).toBe("PUBLICADO");

    const images = await pool.query(
      "SELECT url FROM product_images WHERE producto_id = $1",
      [product.id]
    );
    expect(images.rowCount).toBe(1);
  });

  it("aísla productos, bodegas y pedidos entre vendedores", async () => {
    const sellerA = await createSeller("aislamiento-a");
    const sellerB = await createSeller("aislamiento-b");
    const warehouseA = await createWarehouse(sellerA.sellerId, "A");
    const warehouseB = await createWarehouse(sellerB.sellerId, "B");
    const productA = await insertProduct(sellerA.sellerId, `ISO-A-${runId}`);
    const productB = await insertProduct(sellerB.sellerId, `ISO-B-${runId}`);
    const orderB = await createOrder(sellerB.sellerId, productB, "iso-b");

    const actorA = { usuarioId: sellerA.usuarioId, sellerId: sellerA.sellerId };
    const actorB = { usuarioId: sellerB.usuarioId, sellerId: sellerB.sellerId };
    const clock = new FixedClock(NOW);
    const ids = new UuidGenerator();

    const getProduct = new GetSellerProduct(store);
    const updateProduct = new UpdateSellerProduct(store, clock);
    const ingress = new RegisterInventoryIngress(store, clock, ids);
    const listOrders = new ListSellerOrders(store);
    const getOrder = new GetSellerOrder(store);

    await expect(getProduct.execute(actorA, productB)).rejects.toMatchObject({
      code: "RECURSO_NO_ENCONTRADO"
    });
    await expect(
      updateProduct.execute(actorA, productB, { nombre: "Intrusión" })
    ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });
    await expect(
      ingress.execute(actorA, {
        productoId: productB,
        bodegaId: warehouseA,
        cantidad: 1,
        idempotencyKey: `iso-cross-${runId}`
      })
    ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });
    await expect(
      ingress.execute(actorA, {
        productoId: productA,
        bodegaId: warehouseB,
        cantidad: 1,
        idempotencyKey: `iso-cross-2-${runId}`
      })
    ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });

    const ordersA = await listOrders.execute(actorA);
    expect(ordersA).toEqual([]);
    await expect(getOrder.execute(actorA, orderB.orderId)).rejects.toMatchObject({
      code: "RECURSO_NO_ENCONTRADO"
    });

    const ordersB = await listOrders.execute(actorB);
    expect(ordersB.map((order) => order.id)).toContain(orderB.orderId);
    const detail = await getOrder.execute(actorB, orderB.orderId);
    expect(detail.items).toHaveLength(1);
    expect(detail.items[0]?.productoId).toBe(productB);
  });

  it("registra ingresos atómicos e idempotentes y conserva el movimiento", async () => {
    const seller = await createSeller("ingreso");
    const warehouseId = await createWarehouse(seller.sellerId, "ingreso");
    const productId = await insertProduct(seller.sellerId, `ING-${runId}`);
    const actor = { usuarioId: seller.usuarioId, sellerId: seller.sellerId };
    const clock = new FixedClock(NOW);
    const ingress = new RegisterInventoryIngress(store, clock, new UuidGenerator());

    const payload = {
      productoId: productId,
      bodegaId: warehouseId,
      cantidad: 7,
      idempotencyKey: `ing-${runId}`,
      motivo: "Carga inicial"
    };

    const first = await ingress.execute(actor, payload);
    expect(first.duplicado).toBe(false);
    expect(first.posicion.onHand).toBe(7);
    expect(first.posicion.disponible).toBe(7);

    const second = await ingress.execute(actor, payload);
    expect(second.duplicado).toBe(true);
    expect(second.movimientoId).toBe(first.movimientoId);
    expect(second.posicion.onHand).toBe(7);

    const positions = await pool.query<{ on_hand: number }>(
      "SELECT on_hand FROM inventory WHERE producto_id = $1 AND bodega_id = $2",
      [productId, warehouseId]
    );
    expect(positions.rows[0]?.on_hand).toBe(7);

    const movements = await pool.query<{
      tipo: string;
      cantidad: number;
      actor_id: string;
      referencia_tipo: string;
    }>(
      `SELECT tipo, cantidad, actor_id, referencia_tipo
         FROM inventory_movements
        WHERE producto_id = $1`,
      [productId]
    );
    expect(movements.rowCount).toBe(1);
    expect(movements.rows[0]).toMatchObject({
      tipo: "INGRESO",
      cantidad: 7,
      actor_id: seller.usuarioId,
      referencia_tipo: "INGRESO"
    });
  });

  it("rechaza stock negativo y productos digitales en inventario", async () => {
    const seller = await createSeller("limites");
    const warehouseId = await createWarehouse(seller.sellerId, "limites");
    const physicalId = await insertProduct(seller.sellerId, `LIM-${runId}`);
    const digitalId = await insertProduct(seller.sellerId, `DIG-${runId}`, {
      tipoEntrega: "DIGITAL"
    });
    const actor = { usuarioId: seller.usuarioId, sellerId: seller.sellerId };
    const clock = new FixedClock(NOW);
    const ingress = new RegisterInventoryIngress(store, clock, new UuidGenerator());

    await ingress.execute(actor, {
      productoId: physicalId,
      bodegaId: warehouseId,
      cantidad: 3,
      idempotencyKey: `lim-${runId}`
    });

    await expect(
      pool.query("UPDATE inventory SET on_hand = -1 WHERE producto_id = $1", [
        physicalId
      ])
    ).rejects.toMatchObject({ code: "23514" });

    await expect(
      ingress.execute(actor, {
        productoId: digitalId,
        bodegaId: warehouseId,
        cantidad: 1,
        idempotencyKey: `dig-${runId}`
      })
    ).rejects.toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: expect.objectContaining({ motivo: "PRODUCTO_DIGITAL_SIN_INVENTARIO" })
    });
  });

  it("bloquea mutaciones de un vendedor suspendido", async () => {
    const seller = await createSeller("suspendido", "SUSPENDIDO");
    const actor = { usuarioId: seller.usuarioId, sellerId: seller.sellerId };
    const create = new CreateSellerProduct(store, new FixedClock(NOW), new UuidGenerator());

    await expect(
      create.execute(actor, {
        datos: {
          nombre: "Producto",
          descripcion: "Descripción",
          categoria: "HOGAR",
          tipoEntrega: "FISICA",
          sku: `SUSP-${runId}`,
          precioCentavos: 1000,
          moneda: "COP"
        }
      })
    ).rejects.toMatchObject({ code: "NO_AUTORIZADO" });

    // La consulta sí está permitida para cualquier estado del perfil.
    expect(await store.listProducts(seller.sellerId)).toEqual([]);
  });

  it("crea bodegas propias y no acepta nombres vacíos", async () => {
    const seller = await createSeller("bodegas");
    const actor = { usuarioId: seller.usuarioId, sellerId: seller.sellerId };
    const create = new CreateSellerWarehouse(
      store,
      new FixedClock(NOW),
      new UuidGenerator()
    );

    const created = await create.execute(actor, {
      nombre: "Bodega Norte",
      ubicacion: "Bogotá"
    });
    warehouseIds.push(created.id);
    expect(created.vendedorId).toBe(seller.sellerId);
    expect(created.estado).toBe("ACTIVA");

    await expect(
      create.execute(actor, { nombre: "   ", ubicacion: "Bogotá" })
    ).rejects.toMatchObject({ code: "VALIDACION_INVALIDA" });
  });
});
