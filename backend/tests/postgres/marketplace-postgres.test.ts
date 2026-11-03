import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { IdGenerator } from "../../src/shared/application/ports.js";
import { warehouseId } from "../../src/shared/domain/ids.js";
import { UuidGenerator } from "../../src/shared/infrastructure/uuid-generator.js";
import { Argon2PasswordHasher } from "../../src/modules/identity/infrastructure/argon2-password-hasher.js";
import { PostgresAddressStore } from "../../src/modules/buyers/infrastructure/postgres-address-store.js";
import {
  CreateAddress,
  DeleteAddress,
  ListAddresses,
  SetPrincipalAddress,
  UpdateAddress
} from "../../src/modules/buyers/application/address-use-cases.js";
import {
  RegisterSeller
} from "../../src/modules/sellers/application/register-seller.js";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import { PostgresSellerRegistrationStore } from "../../src/modules/sellers/infrastructure/postgres-seller-registration-store.js";
import { PostgresCheckoutStore } from "../../src/modules/orders/infrastructure/postgres-checkout-store.js";
import type {
  CheckoutCommand,
  ResultadoPagoSimulado
} from "../../src/modules/orders/application/ports.js";
import { FixedClock } from "../support/doubles.js";
import { ensureTestSchema, requireTestDatabaseUrl } from "./support.js";

const PASSWORD = "NexusMarketDemo2026!";
const NOW = "2026-11-01T12:00:00.000Z";
const runId = randomUUID().replace(/-/g, "").slice(0, 12);

let pool: Pool;
let databaseUrl: string;
let checkoutStore: PostgresCheckoutStore;
let addressStore: PostgresAddressStore;
let sellerStore: PostgresSellerRegistrationStore;
let credentialHash: string;
const hasher = new Argon2PasswordHasher();

interface CheckoutFixture {
  readonly compradorId: string;
  readonly carritoId: string;
  readonly addressId: string;
  readonly usuarioIds: string[];
  readonly sellerIds: string[];
  readonly warehouseIds: string[];
  readonly productoIds: string[];
  readonly inventoryIds: string[];
}

const fixtures: CheckoutFixture[] = [];
const extraUserIds: string[] = [];
const extraSellerIds: string[] = [];
const extraWarehouseIds: string[] = [];

async function insertUser(
  id: string,
  rol: "COMPRADOR" | "VENDEDOR" | "ADMINISTRADOR",
  label: string
): Promise<void> {
  await pool.query(
    `INSERT INTO users (
       id, nombre_completo, correo_normalizado, documento_tipo, documento_pais,
       documento_numero, hash_credencial, rol, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CC', 'CO', $4, $5, $6, 'ACTIVO', $7, $7)`,
    [
      id,
      `Usuario ${label}`,
      `${label}-${runId}@example.test`,
      `DOC-${label}-${runId}`,
      credentialHash,
      rol,
      NOW
    ]
  );
}

async function createCheckoutFixture(
  options: { readonly secondSeller?: boolean } = {}
): Promise<CheckoutFixture> {
  const compradorId = randomUUID();
  const buyerUserId = randomUUID();
  const carritoId = randomUUID();
  const addressId = randomUUID();
  const fixture: CheckoutFixture = {
    compradorId,
    carritoId,
    addressId,
    usuarioIds: [buyerUserId],
    sellerIds: [],
    warehouseIds: [],
    productoIds: [],
    inventoryIds: []
  };

  await insertUser(buyerUserId, "COMPRADOR", `buyer-${compradorId}`);
  await pool.query(
    `INSERT INTO buyers (id, usuario_id, estado_comercial, creado_en)
     VALUES ($1, $2, 'HABILITADO', $3)`,
    [compradorId, buyerUserId, NOW]
  );
  await pool.query(
    `INSERT INTO carts (id, comprador_id, actualizado_en, version)
     VALUES ($1, $2, $3, 1)`,
    [carritoId, compradorId, NOW]
  );
  await pool.query(
    `INSERT INTO buyer_addresses (
       id, comprador_id, destinatario, telefono, linea1, linea2, ciudad,
       region, codigo_postal, pais, es_principal, creada_en, actualizada_en
     ) VALUES ($1, $2, 'Compradora Demo', '+57 300 000 0000', 'Calle 1 # 2-3',
               'Apto 1', 'Bogotá', 'Cundinamarca', '110111', 'CO', true, $3, $3)`,
    [addressId, compradorId, NOW]
  );

  await addSellerWithProduct(fixture, "primary", 10, 100000);
  if (options.secondSeller === true) {
    await addSellerWithProduct(fixture, "secondary", 7, 250000);
  }

  fixtures.push(fixture);
  return fixture;
}

async function addSellerWithProduct(
  fixture: CheckoutFixture,
  label: string,
  stock: number,
  priceCentavos: number
): Promise<string> {
  const sellerUserId = randomUUID();
  const sellerId = randomUUID();
  const warehouse = randomUUID();
  const productoId = randomUUID();
  const inventoryId = randomUUID();

  await insertUser(
    sellerUserId,
    "VENDEDOR",
    `seller-${label}-${fixture.compradorId}`
  );
  await pool.query(
    `INSERT INTO sellers (id, usuario_id, nombre_comercial, estado, creado_en)
     VALUES ($1, $2, $3, 'ACTIVO', $4)`,
    [sellerId, sellerUserId, `Vendedor ${label} ${runId}`, NOW]
  );
  await pool.query(
    `INSERT INTO warehouses (id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en)
     VALUES ($1, $2, $3, 'Bogotá', 'VENDEDOR', 'ACTIVA', $4)`,
    [warehouse, sellerId, `Bodega ${label} ${runId}`, NOW]
  );
  await pool.query(
    `INSERT INTO products (
       id, vendedor_id, nombre, descripcion, categoria, estado, tipo_entrega,
       sku, precio_centavos, moneda, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'Producto de prueba', 'ELECTRONICA', 'PUBLICADO',
               'FISICA', $4, $5, 'COP', $6, $6)`,
    [productoId, sellerId, `Producto ${label} ${runId}`, `SKU-${label}-${fixture.compradorId}`, priceCentavos, NOW]
  );
  await pool.query(
    `INSERT INTO inventory (
       id, producto_id, bodega_id, on_hand, reserved, unavailable, version, actualizado_en
     ) VALUES ($1, $2, $3, $4, 0, 0, 1, $5)`,
    [inventoryId, productoId, warehouse, stock, NOW]
  );

  fixture.usuarioIds.push(sellerUserId);
  fixture.sellerIds.push(sellerId);
  fixture.warehouseIds.push(warehouse);
  fixture.productoIds.push(productoId);
  fixture.inventoryIds.push(inventoryId);
  return productoId;
}

async function addCartItem(
  fixture: CheckoutFixture,
  productoId: string,
  cantidad: number,
  precioReferencialCentavos: number
): Promise<void> {
  await pool.query(
    `INSERT INTO cart_items (
       carrito_id, producto_id, cantidad, precio_referencial_centavos,
       moneda_referencial, agregado_en, actualizado_en
     ) VALUES ($1, $2, $3, $4, 'COP', $5, $5)`,
    [fixture.carritoId, productoId, cantidad, precioReferencialCentavos, NOW]
  );
}

function checkoutCommand(
  fixture: CheckoutFixture,
  overrides: Partial<CheckoutCommand> = {}
): CheckoutCommand {
  return {
    compradorId: fixture.compradorId,
    idempotencyKey: `idem-${randomUUID()}`,
    direccionEntregaId: fixture.addressId,
    confirmarPrecio: false,
    resultadoPagoSimulado: "CONFIRMADO",
    correlationId: `corr-${randomUUID()}`,
    now: NOW,
    ...overrides
  };
}

async function cleanupFixture(fixture: CheckoutFixture): Promise<void> {
  const compradorId = fixture.compradorId;
  await pool.query(
    `DELETE FROM inventory_reservations
      WHERE pedido_id IN (SELECT id FROM orders WHERE comprador_id = $1)`,
    [compradorId]
  );
  await pool.query(
    `DELETE FROM payments
      WHERE pedido_id IN (SELECT id FROM orders WHERE comprador_id = $1)`,
    [compradorId]
  );
  await pool.query(
    `DELETE FROM order_items
      WHERE pedido_id IN (SELECT id FROM orders WHERE comprador_id = $1)`,
    [compradorId]
  );
  await pool.query("DELETE FROM orders WHERE comprador_id = $1", [compradorId]);
  await pool.query("DELETE FROM checkout_attempts WHERE comprador_id = $1", [
    compradorId
  ]);
  await pool.query("DELETE FROM cart_items WHERE carrito_id = $1", [
    fixture.carritoId
  ]);
  await pool.query("DELETE FROM carts WHERE id = $1", [fixture.carritoId]);
  await pool.query("DELETE FROM buyer_addresses WHERE comprador_id = $1", [
    compradorId
  ]);
  await pool.query("DELETE FROM inventory WHERE id = ANY($1::uuid[])", [
    fixture.inventoryIds
  ]);
  await pool.query("DELETE FROM products WHERE id = ANY($1::uuid[])", [
    fixture.productoIds
  ]);
  await pool.query("DELETE FROM warehouses WHERE id = ANY($1::uuid[])", [
    fixture.warehouseIds
  ]);
  await pool.query("DELETE FROM sellers WHERE id = ANY($1::uuid[])", [
    fixture.sellerIds
  ]);
  await pool.query("DELETE FROM buyers WHERE id = $1", [compradorId]);
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
    fixture.usuarioIds
  ]);
}

describe("Marketplace contra PostgreSQL real", () => {
  beforeAll(async () => {
    databaseUrl = requireTestDatabaseUrl();
    credentialHash = await hasher.hash(PASSWORD);
    pool = new Pool({ connectionString: databaseUrl, max: 4 });
    await ensureTestSchema(pool);
    checkoutStore = new PostgresCheckoutStore(databaseUrl, new UuidGenerator());
    addressStore = new PostgresAddressStore(databaseUrl);
    sellerStore = new PostgresSellerRegistrationStore(databaseUrl);
  });

  afterAll(async () => {
    if (!pool) {
      return;
    }
    try {
      for (const fixture of fixtures) {
        await cleanupFixture(fixture);
      }
      await pool.query("DELETE FROM audit_log WHERE correlation_id LIKE $1", [
        `corr-seller-${runId}%`
      ]);
      await pool.query("DELETE FROM outbox WHERE correlation_id LIKE $1", [
        `corr-seller-${runId}%`
      ]);
      await pool.query("DELETE FROM warehouses WHERE id = ANY($1::uuid[])", [
        extraWarehouseIds
      ]);
      await pool.query("DELETE FROM sellers WHERE id = ANY($1::uuid[])", [
        extraSellerIds
      ]);
      await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
        extraUserIds
      ]);
    } finally {
      await checkoutStore.close();
      await addressStore.close();
      await sellerStore.close();
      await pool.end();
    }
  });

  describe("PI-02: transacción de vendedor y primera bodega", () => {
    function admin(): AuthenticatedUser {
      return {
        usuarioId: randomUUID(),
        nombreCompleto: "Administradora",
        correoElectronico: `admin-${runId}@example.test`,
        rol: "ADMINISTRADOR",
        estado: "ACTIVO",
        compradorId: null,
        sellerId: null
      };
    }

    it("revierte usuario y vendedor si falla la inserción de la bodega", async () => {
      // Creamos una bodega existente y forzamos que el nuevo registro use su id:
      // la clave primaria falla después de insertar users y sellers.
      const existingUserId = randomUUID();
      const existingSellerId = randomUUID();
      const existingWarehouseId = randomUUID();
      await insertUser(existingUserId, "VENDEDOR", `existing-${runId}`);
      await pool.query(
        `INSERT INTO sellers (id, usuario_id, nombre_comercial, estado, creado_en)
         VALUES ($1, $2, $3, 'ACTIVO', $4)`,
        [existingSellerId, existingUserId, `Existente ${runId}`, NOW]
      );
      await pool.query(
        `INSERT INTO warehouses (id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en)
         VALUES ($1, $2, 'Bodega existente', 'Bogotá', 'VENDEDOR', 'ACTIVA', $3)`,
        [existingWarehouseId, existingSellerId, NOW]
      );
      extraUserIds.push(existingUserId);
      extraSellerIds.push(existingSellerId);
      extraWarehouseIds.push(existingWarehouseId);

      const captured: string[] = [];
      const base = new UuidGenerator();
      const ids: IdGenerator = {
        usuarioId: () => {
          const value = base.usuarioId();
          captured.push(value);
          return value;
        },
        compradorId: () => base.compradorId(),
        carritoId: () => base.carritoId(),
        auditId: () => {
          const value = base.auditId();
          captured.push(value);
          return value;
        },
        eventId: () => {
          const value = base.eventId();
          captured.push(value);
          return value;
        },
        sessionId: () => base.sessionId(),
        sellerId: () => {
          const value = base.sellerId();
          captured.push(value);
          return value;
        },
        warehouseId: () => warehouseId(existingWarehouseId),
        addressId: () => base.addressId(),
        checkoutId: () => base.checkoutId(),
        orderId: () => base.orderId(),
        orderItemId: () => base.orderItemId(),
        paymentId: () => base.paymentId(),
        reservationId: () => base.reservationId()
      };
      const correlationId = `corr-seller-rollback-${runId}`;
      const useCase = new RegisterSeller(
        sellerStore,
        hasher,
        new FixedClock(NOW),
        ids
      );

      await expect(
        useCase.execute({
          actor: admin(),
          nombreCompleto: "Vendedor Rollback",
          correoElectronico: `rollback-${runId}@example.test`,
          documentoIdentidad: {
            tipo: "CC",
            pais: "CO",
            numero: `RB-${runId}`
          },
          credencial: PASSWORD,
          nombreComercial: `Rollback ${runId}`,
          bodega: { nombre: "Bodega Rollback", ubicacion: "Bogotá" },
          correlationId
        })
      ).rejects.toMatchObject({ code: "CONFLICTO_UNICIDAD" });

      const userCount = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM users WHERE id = $1",
        [captured[0]]
      );
      expect(userCount.rows[0]?.count).toBe(0);

      const sellerCount = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM sellers WHERE usuario_id = $1",
        [captured[0]]
      );
      expect(sellerCount.rows[0]?.count).toBe(0);

      const auditCount = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM audit_log WHERE correlation_id = $1",
        [correlationId]
      );
      const outboxCount = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM outbox WHERE correlation_id = $1",
        [correlationId]
      );
      expect(auditCount.rows[0]?.count).toBe(0);
      expect(outboxCount.rows[0]?.count).toBe(0);
    });

    it("confirma usuario, vendedor, bodega, auditoría y outbox juntos", async () => {
      const correlationId = `corr-seller-ok-${runId}`;
      const ids = new UuidGenerator();
      const useCase = new RegisterSeller(
        sellerStore,
        hasher,
        new FixedClock(NOW),
        ids
      );

      const result = await useCase.execute({
        actor: admin(),
        nombreCompleto: "Vendedor Correcto",
        correoElectronico: `ok-${runId}@example.test`,
        documentoIdentidad: {
          tipo: "CC",
          pais: "CO",
          numero: `OK-${runId}`
        },
        credencial: PASSWORD,
        nombreComercial: `Correcto ${runId}`,
        bodega: { nombre: "Bodega Correcta", ubicacion: "Medellín" },
        correlationId
      });

      extraUserIds.push(result.usuarioId);
      extraSellerIds.push(result.sellerId);
      extraWarehouseIds.push(result.warehouseId);

      const rows = await pool.query<{
        users: number;
        sellers: number;
        warehouses: number;
        audit: number;
        outbox: number;
      }>(
        `SELECT
           (SELECT COUNT(*)::int FROM users WHERE id = $1) AS users,
           (SELECT COUNT(*)::int FROM sellers WHERE id = $2) AS sellers,
           (SELECT COUNT(*)::int FROM warehouses WHERE id = $3) AS warehouses,
           (SELECT COUNT(*)::int FROM audit_log WHERE correlation_id = $4) AS audit,
           (SELECT COUNT(*)::int FROM outbox WHERE correlation_id = $4) AS outbox`,
        [result.usuarioId, result.sellerId, result.warehouseId, correlationId]
      );
      expect(rows.rows[0]).toEqual({
        users: 1,
        sellers: 1,
        warehouses: 1,
        audit: 1,
        outbox: 1
      });
    });
  });

  describe("L-01: direcciones y dirección principal", () => {
    it("mantiene una sola principal, promueve la más antigua y respeta la propiedad", async () => {
      const buyerUserId = randomUUID();
      const compradorId = randomUUID();
      const otherBuyerUserId = randomUUID();
      const otherCompradorId = randomUUID();
      await insertUser(buyerUserId, "COMPRADOR", `addr-a-${runId}`);
      await insertUser(otherBuyerUserId, "COMPRADOR", `addr-b-${runId}`);
      await pool.query(
        `INSERT INTO buyers (id, usuario_id, estado_comercial, creado_en)
         VALUES ($1, $2, 'HABILITADO', $3), ($4, $5, 'HABILITADO', $3)`,
        [compradorId, buyerUserId, NOW, otherCompradorId, otherBuyerUserId]
      );

      const ids = new UuidGenerator();
      const clock = new FixedClock(NOW);
      const create = new CreateAddress(addressStore, clock, ids);
      const update = new UpdateAddress(addressStore, clock);
      const remove = new DeleteAddress(addressStore);
      const setPrincipal = new SetPrincipalAddress(addressStore, clock);
      const list = new ListAddresses(addressStore);

      const first = await create.execute(compradorId, {
        destinatario: "Compradora A",
        telefono: "+57 300 000 0000",
        linea1: "Calle 1 # 2-3",
        ciudad: "Bogotá",
        region: "Cundinamarca"
      });
      const second = await create.execute(compradorId, {
        destinatario: "Compradora A",
        telefono: "+57 300 000 0000",
        linea1: "Carrera 9 # 10-11",
        ciudad: "Bogotá",
        region: "Cundinamarca"
      });

      expect(first.esPrincipal).toBe(true);
      expect(second.esPrincipal).toBe(false);

      await setPrincipal.execute(compradorId, second.id);
      const afterSet = await list.execute(compradorId);
      expect(afterSet[0]).toMatchObject({ id: second.id, esPrincipal: true });
      expect(afterSet.filter((address) => address.esPrincipal)).toHaveLength(1);

      await update.execute(compradorId, {
        direccionId: first.id,
        ciudad: "Medellín"
      });
      await expect(
        addressStore.findById(compradorId, first.id)
      ).resolves.toMatchObject({ ciudad: "Medellín" });

      await expect(
        addressStore.findById(otherCompradorId, first.id)
      ).resolves.toBeNull();
      await expect(
        setPrincipal.execute(otherCompradorId, first.id)
      ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });
      await expect(
        remove.execute(otherCompradorId, first.id)
      ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });

      await remove.execute(compradorId, second.id);
      const afterDelete = await list.execute(compradorId);
      expect(afterDelete).toHaveLength(1);
      expect(afterDelete[0]).toMatchObject({ id: first.id, esPrincipal: true });

      await pool.query("DELETE FROM buyer_addresses WHERE comprador_id = ANY($1::uuid[])", [
        [compradorId, otherCompradorId]
      ]);
      await pool.query("DELETE FROM buyers WHERE id = ANY($1::uuid[])", [
        [compradorId, otherCompradorId]
      ]);
      await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
        [buyerUserId, otherBuyerUserId]
      ]);
    });
  });

  describe("PI-12: checkout, reservas e idempotencia", () => {
    it("confirma el pago, reserva inventario y vacía el carrito", async () => {
      const fixture = await createCheckoutFixture();
      await addCartItem(fixture, fixture.productoIds[0]!, 2, 100000);

      const result = await checkoutStore.executeCheckout(checkoutCommand(fixture));

      expect(result.estado).toBe("CONFIRMADO");
      expect(result.pedidos).toHaveLength(1);
      const order = result.pedidos[0]!;
      expect(order).toMatchObject({
        estado: "EN_PREPARACION",
        estadoPago: "CAPTURADO",
        totalCentavos: 200000,
        itemsCount: 1
      });
      expect(order.pago).toMatchObject({ estado: "CAPTURADO", montoCentavos: 200000 });
      expect(order.direccionEntrega).toMatchObject({
        direccionId: fixture.addressId,
        linea1: "Calle 1 # 2-3",
        ciudad: "Bogotá",
        capturadaEn: NOW
      });

      const inventory = await pool.query<{ reserved: number }>(
        "SELECT reserved FROM inventory WHERE id = $1",
        [fixture.inventoryIds[0]]
      );
      expect(inventory.rows[0]?.reserved).toBe(2);

      const reservations = await pool.query<{ estado: string; cantidad: number }>(
        "SELECT estado, cantidad FROM inventory_reservations WHERE checkout_id = $1",
        [result.checkoutId]
      );
      expect(reservations.rows).toEqual([{ estado: "ACTIVA", cantidad: 2 }]);

      const cart = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM cart_items WHERE carrito_id = $1",
        [fixture.carritoId]
      );
      expect(cart.rows[0]?.count).toBe(0);
    });

    it("reintenta con la misma clave sin duplicar pedidos ni reservas", async () => {
      const fixture = await createCheckoutFixture();
      await addCartItem(fixture, fixture.productoIds[0]!, 2, 100000);
      const command = checkoutCommand(fixture);

      const first = await checkoutStore.executeCheckout(command);
      const second = await checkoutStore.executeCheckout(command);

      expect(second.checkoutId).toBe(first.checkoutId);
      expect(second.pedidos.map((order) => order.id)).toEqual(
        first.pedidos.map((order) => order.id)
      );

      const inventory = await pool.query<{ reserved: number }>(
        "SELECT reserved FROM inventory WHERE id = $1",
        [fixture.inventoryIds[0]]
      );
      expect(inventory.rows[0]?.reserved).toBe(2);

      const orders = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM orders WHERE comprador_id = $1",
        [fixture.compradorId]
      );
      expect(orders.rows[0]?.count).toBe(1);

      const payments = await pool.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
           FROM payments p
           JOIN orders o ON o.id = p.pedido_id
          WHERE o.comprador_id = $1`,
        [fixture.compradorId]
      );
      expect(payments.rows[0]?.count).toBe(1);
    });

    it("cancela el pedido y libera la reserva si el pago es rechazado", async () => {
      const fixture = await createCheckoutFixture();
      await addCartItem(fixture, fixture.productoIds[0]!, 3, 100000);

      const result = await checkoutStore.executeCheckout(
        checkoutCommand(fixture, { resultadoPagoSimulado: "RECHAZADO" })
      );

      expect(result.estado).toBe("RECHAZADO");
      expect(result.pedidos[0]).toMatchObject({
        estado: "CANCELADO",
        estadoPago: "RECHAZADO"
      });
      expect(result.pedidos[0]?.pago).toMatchObject({ estado: "RECHAZADO" });

      const inventory = await pool.query<{ reserved: number }>(
        "SELECT reserved FROM inventory WHERE id = $1",
        [fixture.inventoryIds[0]]
      );
      expect(inventory.rows[0]?.reserved).toBe(0);

      const reservations = await pool.query<{
        estado: string;
        liberada_en: Date | null;
      }>(
        "SELECT estado, liberada_en FROM inventory_reservations WHERE checkout_id = $1",
        [result.checkoutId]
      );
      expect(reservations.rows[0]?.estado).toBe("LIBERADA");
      expect(reservations.rows[0]?.liberada_en).not.toBeNull();

      const cart = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM cart_items WHERE carrito_id = $1",
        [fixture.carritoId]
      );
      expect(cart.rows[0]?.count).toBe(1);
    });

    it("mantiene pendiente el pago desconocido y no lo trata como éxito ni rechazo", async () => {
      const fixture = await createCheckoutFixture();
      await addCartItem(fixture, fixture.productoIds[0]!, 1, 100000);
      const command = checkoutCommand(fixture, {
        resultadoPagoSimulado: "DESCONOCIDO"
      });

      const first = await checkoutStore.executeCheckout(command);
      expect(first.estado).toBe("DESCONOCIDO");
      expect(first.pedidos[0]).toMatchObject({
        estado: "PENDIENTE_DE_PAGO",
        estadoPago: "PENDIENTE"
      });
      expect(first.pedidos[0]?.pago).toMatchObject({ estado: "PENDIENTE" });

      const retry = await checkoutStore.executeCheckout(command);
      expect(retry.checkoutId).toBe(first.checkoutId);
      expect(retry.estado).toBe("DESCONOCIDO");

      const inventory = await pool.query<{ reserved: number }>(
        "SELECT reserved FROM inventory WHERE id = $1",
        [fixture.inventoryIds[0]]
      );
      expect(inventory.rows[0]?.reserved).toBe(1);

      const reservations = await pool.query<{ estado: string }>(
        "SELECT estado FROM inventory_reservations WHERE checkout_id = $1",
        [first.checkoutId]
      );
      expect(reservations.rows[0]?.estado).toBe("ACTIVA");

      const orders = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM orders WHERE comprador_id = $1",
        [fixture.compradorId]
      );
      expect(orders.rows[0]?.count).toBe(1);
    });

    it("exige confirmar el precio cuando cambió y usa el precio actual al confirmar", async () => {
      const fixture = await createCheckoutFixture();
      await addCartItem(fixture, fixture.productoIds[0]!, 1, 99500);

      await expect(
        checkoutStore.executeCheckout(checkoutCommand(fixture))
      ).rejects.toMatchObject({
        code: "REGLA_NEGOCIO_INCUMPLIDA",
        details: { motivo: "PRECIO_CAMBIADO" }
      });

      const ordersAfterReject = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM orders WHERE comprador_id = $1",
        [fixture.compradorId]
      );
      expect(ordersAfterReject.rows[0]?.count).toBe(0);

      const result = await checkoutStore.executeCheckout(
        checkoutCommand(fixture, { confirmarPrecio: true })
      );
      expect(result.pedidos[0]?.totalCentavos).toBe(100000);

      const cart = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM cart_items WHERE carrito_id = $1",
        [fixture.carritoId]
      );
      expect(cart.rows[0]?.count).toBe(0);
    });

    it("rechaza carrito vacío, falta de dirección, dirección ajena y stock insuficiente", async () => {
      const empty = await createCheckoutFixture();
      await expect(
        checkoutStore.executeCheckout(checkoutCommand(empty))
      ).rejects.toMatchObject({
        code: "REGLA_NEGOCIO_INCUMPLIDA",
        details: { motivo: "CARRITO_VACIO" }
      });

      const physical = await createCheckoutFixture();
      await addCartItem(physical, physical.productoIds[0]!, 1, 100000);
      await expect(
        checkoutStore.executeCheckout(
          checkoutCommand(physical, { direccionEntregaId: null })
        )
      ).rejects.toMatchObject({
        code: "REGLA_NEGOCIO_INCUMPLIDA",
        details: { motivo: "DIRECCION_REQUERIDA" }
      });

      const other = await createCheckoutFixture();
      await addCartItem(other, other.productoIds[0]!, 1, 100000);
      await expect(
        checkoutStore.executeCheckout(
          checkoutCommand(other, { direccionEntregaId: physical.addressId })
        )
      ).rejects.toMatchObject({
        code: "REGLA_NEGOCIO_INCUMPLIDA",
        details: { motivo: "DIRECCION_INVALIDA" }
      });

      const scarce = await createCheckoutFixture();
      await addCartItem(scarce, scarce.productoIds[0]!, 11, 100000);
      await expect(
        checkoutStore.executeCheckout(checkoutCommand(scarce))
      ).rejects.toMatchObject({
        code: "REGLA_NEGOCIO_INCUMPLIDA",
        details: { motivo: "CARRITO_NO_VENDIBLE" }
      });
    });

    it("crea un pedido por vendedor y suma el total del carrito", async () => {
      const fixture = await createCheckoutFixture({ secondSeller: true });
      await addCartItem(fixture, fixture.productoIds[0]!, 2, 100000);
      await addCartItem(fixture, fixture.productoIds[1]!, 1, 250000);

      const result = await checkoutStore.executeCheckout(checkoutCommand(fixture));

      expect(result.pedidos).toHaveLength(2);
      expect(new Set(result.pedidos.map((order) => order.vendedorId)).size).toBe(2);
      expect(result.pedidos.map((order) => order.totalCentavos).sort()).toEqual([
        200000,
        250000
      ]);

      const reservations = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM inventory_reservations WHERE checkout_id = $1",
        [result.checkoutId]
      );
      expect(reservations.rows[0]?.count).toBe(2);

      const listed = await checkoutStore.listOrders(fixture.compradorId);
      expect(listed).toHaveLength(2);

      const detail = await checkoutStore.findOrder(
        fixture.compradorId,
        result.pedidos[0]!.id
      );
      expect(detail?.items).toHaveLength(1);
      expect(
        await checkoutStore.findOrder(fixture.compradorId, randomUUID())
      ).toBeNull();
    });
  });
});
