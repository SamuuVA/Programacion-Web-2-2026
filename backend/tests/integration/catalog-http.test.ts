import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import { Argon2PasswordHasher } from "../../src/modules/identity/infrastructure/argon2-password-hasher.js";
import { DependencyUnavailableError } from "../../src/shared/domain/errors.js";
import { FakeBuyerRegistrationStore } from "../support/fake-buyer-registration-store.js";
import {
  FakeCatalogQueryRepository,
  sampleProducts
} from "../support/fake-catalog-query-repository.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";

const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";
const DIGITAL_ID = "44444444-4444-4444-8444-444444444444";

function createApp(catalog = new FakeCatalogQueryRepository()) {
  return buildApp(
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
      catalog,
      hasher: new Argon2PasswordHasher(),
      clock: new FixedClock(),
      ids: new SequentialIds()
    }
  );
}

describe("Contrato HTTP del catálogo público", () => {
  let app: FastifyInstance | undefined;

  beforeEach(() => {
    app = undefined;
  });

  afterEach(async () => {
    await app?.close();
  });

  it("lista solo el catálogo público con paginación y contrato declarado", async () => {
    app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/products?page=1&pageSize=2",
      headers: { "x-correlation-id": "corr-catalog-001" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-correlation-id"]).toBe("corr-catalog-001");
    const body = response.json();
    expect(body.data.pagination).toEqual({
      page: 1,
      pageSize: 2,
      total: 3,
      totalPages: 2
    });
    expect(body.data.items).toHaveLength(2);
    expect(body.data.items[0]).toMatchObject({
      nombre: "Audífonos Aurora",
      categoria: "ELECTRONICA",
      precio: { montoCentavos: 42990000, moneda: "COP" },
      disponible: 18,
      vendedor: { nombreComercial: "Estudio Aurora" }
    });
    expect(body.data.items[0]).not.toHaveProperty("sku");
    expect(JSON.stringify(body)).not.toContain("hash");
  });

  it("filtra por categoría y búsqueda sin distinguir mayúsculas", async () => {
    app = await createApp();

    const category = await app.inject({
      method: "GET",
      url: "/api/v1/products?categoria=HOGAR"
    });
    expect(category.statusCode).toBe(200);
    expect(category.json().data.items).toHaveLength(1);
    expect(category.json().data.items[0].nombre).toBe("Lámpara Nido");

    const search = await app.inject({
      method: "GET",
      url: "/api/v1/products?search=AURORA"
    });
    expect(search.statusCode).toBe(200);
    expect(search.json().data.items).toHaveLength(1);
  });

  it("ordena por precio ascendente", async () => {
    app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/products?orden=precio_asc"
    });

    expect(response.statusCode).toBe(200);
    expect(
      response.json().data.items.map((item: { nombre: string }) => item.nombre)
    ).toEqual([
      "Guía de fotografía urbana",
      "Lámpara Nido",
      "Audífonos Aurora"
    ]);
  });

  it("devuelve el detalle con SKU, imágenes y disponibilidad", async () => {
    app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${PRODUCT_ID}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      id: PRODUCT_ID,
      sku: "AUR-AUD-001",
      nombre: "Audífonos Aurora",
      disponible: 18,
      vendedor: { nombreComercial: "Estudio Aurora" }
    });
    expect(response.json().data.imagenes).toHaveLength(2);
  });

  it("representa la entrega digital sin stock físico", async () => {
    app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${DIGITAL_ID}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      tipoEntrega: "DIGITAL",
      disponible: null
    });
  });

  it("devuelve 404 para un producto inexistente o no publicado", async () => {
    app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/products/99999999-9999-4999-8999-999999999999",
      headers: { "x-correlation-id": "corr-catalog-404" }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        codigo: "RECURSO_NO_ENCONTRADO",
        mensaje: "El producto no existe o no está disponible en el catálogo.",
        correlationId: "corr-catalog-404"
      }
    });
  });

  it("devuelve 400 para identificador mal formado", async () => {
    app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/products/no-es-uuid"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.codigo).toBe("VALIDACION_INVALIDA");
  });

  it("rechaza filtros desconocidos y tamaños fuera del contrato", async () => {
    app = await createApp();

    const unknown = await app.inject({
      method: "GET",
      url: "/api/v1/products?estado=SUSPENDIDO"
    });
    expect(unknown.statusCode).toBe(400);

    const oversized = await app.inject({
      method: "GET",
      url: "/api/v1/products?pageSize=100"
    });
    expect(oversized.statusCode).toBe(400);

    const badPage = await app.inject({
      method: "GET",
      url: "/api/v1/products?page=0"
    });
    expect(badPage.statusCode).toBe(400);
  });

  it("expone el catálogo controlado de categorías", async () => {
    app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/categories"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [
        { codigo: "ELECTRONICA", nombre: "Electrónica" },
        { codigo: "ROPA", nombre: "Ropa" },
        { codigo: "HOGAR", nombre: "Hogar" },
        { codigo: "DIGITAL", nombre: "Digital" }
      ]
    });
  });

  it("mantiene el sobre de error uniforme si la persistencia falla", async () => {
    const failing = new FakeCatalogQueryRepository(sampleProducts());
    failing.searchPublic = async () => {
      throw new DependencyUnavailableError(
        "No fue posible consultar el catálogo."
      );
    };
    app = await createApp(failing);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/products"
    });
    expect(response.statusCode).toBe(503);
    expect(response.json().error.codigo).toBe("DEPENDENCIA_NO_DISPONIBLE");
  });
});
