import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresCatalogQueryRepository } from "../../src/modules/catalog/infrastructure/postgres-catalog-query-repository.js";
import { ensureTestSchema, requireTestDatabaseUrl } from "./support.js";

interface Fixture {
  readonly userIds: string[];
  readonly sellerIds: string[];
  readonly warehouseIds: string[];
  readonly warehouseId: string;
  readonly otherWarehouseId: string;
  readonly products: string[];
}

let pool: Pool;
let repository: PostgresCatalogQueryRepository;
let fixture: Fixture;

const NOW = new Date("2026-10-30T12:00:00.000Z");

async function insertSeller(label: string, estado = "ACTIVO") {
  const userId = randomUUID();
  const sellerId = randomUUID();
  await pool.query(
    `INSERT INTO users (
       id, nombre_completo, correo_normalizado, documento_tipo, documento_pais,
       documento_numero, hash_credencial, rol, estado, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, 'CC', 'CO', $4, 'test-hash', 'VENDEDOR', 'ACTIVO', $5, $5)`,
    [
      userId,
      `Vendedor ${label}`,
      `seller-${label}-${randomUUID()}@example.com`,
      `DOC-${label}-${randomUUID()}`,
      NOW
    ]
  );
  await pool.query(
    `INSERT INTO sellers (id, usuario_id, nombre_comercial, estado, creado_en)
     VALUES ($1, $2, $3, $4, $5)`,
    [sellerId, userId, `Tienda ${label}`, estado, NOW]
  );
  return { userId, sellerId };
}

async function insertWarehouse(
  sellerId: string,
  label: string,
  estado = "ACTIVA"
) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO warehouses (id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en)
     VALUES ($1, $2, $3, $4, 'VENDEDOR', $5, $6)`,
    [id, sellerId, `Bodega ${label}`, "Bogotá, Colombia", estado, NOW]
  );
  return id;
}

async function insertProduct(options: {
  sellerId: string;
  label: string;
  categoria?: string;
  estado?: string;
  tipoEntrega?: string;
  precioCentavos?: number;
  creadoEn?: Date;
}) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO products (
       id, vendedor_id, nombre, descripcion, categoria, estado, tipo_entrega,
       sku, precio_centavos, moneda, creado_en, actualizado_en
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'COP', $10, $10)`,
    [
      id,
      options.sellerId,
      `Producto ${options.label}`,
      `Descripción de ${options.label}`,
      options.categoria ?? "ELECTRONICA",
      options.estado ?? "PUBLICADO",
      options.tipoEntrega ?? "FISICA",
      `SKU-${options.label}-${randomUUID()}`,
      options.precioCentavos ?? 10000000,
      options.creadoEn ?? NOW
    ]
  );
  await pool.query(
    `INSERT INTO product_images (id, producto_id, url, alt, orden, creado_en)
     VALUES ($1, $2, $3, $4, 0, $5), ($6, $2, $7, $8, 1, $5)`,
    [
      randomUUID(),
      id,
      `/products/${options.label}-1.svg`,
      `Imagen principal de ${options.label}`,
      NOW,
      randomUUID(),
      `/products/${options.label}-2.svg`,
      `Imagen secundaria de ${options.label}`
    ]
  );
  return id;
}

async function insertInventory(
  productoId: string,
  bodegaId: string,
  onHand: number,
  reserved = 0,
  unavailable = 0
) {
  await pool.query(
    `INSERT INTO inventory (
       id, producto_id, bodega_id, on_hand, reserved, unavailable, version, actualizado_en
     ) VALUES ($1, $2, $3, $4, $5, $6, 1, $7)`,
    [randomUUID(), productoId, bodegaId, onHand, reserved, unavailable, NOW]
  );
}

describe("PI-07 QueryCatalog contra PostgreSQL real", () => {
  beforeAll(async () => {
    const databaseUrl = requireTestDatabaseUrl();
    pool = new Pool({ connectionString: databaseUrl, max: 4 });
    await ensureTestSchema(pool);

    const seller = await insertSeller("Aurora");
    const suspendedSeller = await insertSeller("Suspendida", "SUSPENDIDO");
    const warehouseId = await insertWarehouse(seller.sellerId, "Centro");
    const otherWarehouseId = await insertWarehouse(seller.sellerId, "Norte");
    fixture = {
      userIds: [seller.userId, suspendedSeller.userId],
      sellerIds: [seller.sellerId, suspendedSeller.sellerId],
      warehouseIds: [warehouseId, otherWarehouseId],
      warehouseId,
      otherWarehouseId,
      products: []
    };

    const published = await insertProduct({
      sellerId: seller.sellerId,
      label: "Aurora",
      categoria: "ELECTRONICA",
      precioCentavos: 42990000,
      creadoEn: new Date("2026-10-30T10:00:00.000Z")
    });
    const home = await insertProduct({
      sellerId: seller.sellerId,
      label: "Nido",
      categoria: "HOGAR",
      precioCentavos: 18990000,
      creadoEn: new Date("2026-10-29T10:00:00.000Z")
    });
    const digital = await insertProduct({
      sellerId: seller.sellerId,
      label: "Guia",
      categoria: "DIGITAL",
      tipoEntrega: "DIGITAL",
      precioCentavos: 9900000,
      creadoEn: new Date("2026-10-28T10:00:00.000Z")
    });
    const suspended = await insertProduct({
      sellerId: seller.sellerId,
      label: "Suspendido",
      estado: "SUSPENDIDO"
    });
    const fromSuspendedSeller = await insertProduct({
      sellerId: suspendedSeller.sellerId,
      label: "Ajeno"
    });

    await insertInventory(published, fixture.warehouseId, 20, 2, 0);
    await insertInventory(published, fixture.otherWarehouseId, 5, 0, 0);
    await insertInventory(home, fixture.warehouseId, 8, 1, 0);
    await insertInventory(digital, fixture.warehouseId, 0, 0, 0);
    await insertInventory(suspended, fixture.warehouseId, 99, 0, 0);
    await insertInventory(fromSuspendedSeller, fixture.warehouseId, 99, 0, 0);

    fixture.products.push(
      published,
      home,
      digital,
      suspended,
      fromSuspendedSeller
    );

    repository = new PostgresCatalogQueryRepository(databaseUrl);
  });

  afterAll(async () => {
    if (pool && fixture) {
      await pool.query(
        "DELETE FROM inventory WHERE producto_id = ANY($1::uuid[])",
        [fixture.products]
      );
      await pool.query(
        "DELETE FROM product_images WHERE producto_id = ANY($1::uuid[])",
        [fixture.products]
      );
      await pool.query("DELETE FROM products WHERE id = ANY($1::uuid[])", [
        fixture.products
      ]);
      await pool.query("DELETE FROM warehouses WHERE id = ANY($1::uuid[])", [
        fixture.warehouseIds
      ]);
      await pool.query("DELETE FROM sellers WHERE id = ANY($1::uuid[])", [
        fixture.sellerIds
      ]);
      await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
        fixture.userIds
      ]);
    }
    await repository?.close();
    await pool?.end();
  });

  it("solo lista productos publicados de vendedores activos", async () => {
    const page = await repository.searchPublic({
      page: 1,
      pageSize: 12,
      orden: "recientes"
    });

    expect(page.total).toBe(3);
    expect(page.items.map((item) => item.nombre)).toEqual([
      "Producto Aurora",
      "Producto Nido",
      "Producto Guia"
    ]);
  });

  it("calcula disponibilidad con bodegas activas y descuenta reservas", async () => {
    const page = await repository.searchPublic({
      search: "Aurora",
      page: 1,
      pageSize: 12,
      orden: "recientes"
    });

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.disponible).toBe(23);
  });

  it("filtra por categoría, busca y ordena por precio", async () => {
    const category = await repository.searchPublic({
      categoria: "HOGAR",
      page: 1,
      pageSize: 12,
      orden: "recientes"
    });
    expect(category.items.map((item) => item.nombre)).toEqual([
      "Producto Nido"
    ]);

    const search = await repository.searchPublic({
      search: "guia",
      page: 1,
      pageSize: 12,
      orden: "recientes"
    });
    expect(search.items.map((item) => item.nombre)).toEqual(["Producto Guia"]);

    // La búsqueda ignora acentos: "lampara" debe encontrar "Lámpara".
    await pool.query(
      `UPDATE products SET nombre = 'Lámpara de prueba' WHERE id = $1`,
      [fixture.products[1]]
    );
    const accentInsensitive = await repository.searchPublic({
      search: "lampara",
      page: 1,
      pageSize: 12,
      orden: "recientes"
    });
    expect(accentInsensitive.items.map((item) => item.nombre)).toEqual([
      "Lámpara de prueba"
    ]);

    const ordered = await repository.searchPublic({
      page: 1,
      pageSize: 12,
      orden: "precio_asc"
    });
    expect(ordered.items.map((item) => item.precio.montoCentavos)).toEqual([
      9900000, 18990000, 42990000
    ]);
  });

  it("pagina y devuelve el detalle con imágenes ordenadas", async () => {
    const firstPage = await repository.searchPublic({
      page: 1,
      pageSize: 2,
      orden: "recientes"
    });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.total).toBe(3);

    const detail = await repository.findPublicById(fixture.products[0]!);
    expect(detail).not.toBeNull();
    expect(detail).toMatchObject({
      nombre: "Producto Aurora",
      categoria: "ELECTRONICA",
      tipoEntrega: "FISICA",
      precio: { montoCentavos: 42990000, moneda: "COP" },
      disponible: 23,
      vendedor: { nombreComercial: "Tienda Aurora" }
    });
    expect(detail?.imagenes.map((image) => image.orden)).toEqual([0, 1]);
    expect(detail?.imagenPrincipal).toMatchObject({
      url: "/products/Aurora-1.svg",
      alt: "Imagen principal de Aurora"
    });
    expect(detail?.sku).toMatch(/^SKU-Aurora-/);
  });

  it("no expone productos digitales con stock físico y devuelve null", async () => {
    const detail = await repository.findPublicById(fixture.products[2]!);
    expect(detail).toMatchObject({ tipoEntrega: "DIGITAL", disponible: null });
  });

  it("no devuelve productos suspendidos ni de vendedores suspendidos", async () => {
    await expect(
      repository.findPublicById(fixture.products[3]!)
    ).resolves.toBeNull();
    await expect(
      repository.findPublicById(fixture.products[4]!)
    ).resolves.toBeNull();
  });
});
