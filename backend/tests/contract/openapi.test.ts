import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type JsonObject = Record<string, unknown>;

interface ParsedOpenApi {
  readonly openapi: string;
  readonly paths: Record<string, Record<string, unknown>>;
  readonly "x-global-errors"?: Record<string, unknown>;
  readonly components: {
    readonly schemas: Record<string, JsonObject>;
    readonly headers: Record<string, JsonObject>;
    readonly responses: Record<string, JsonObject>;
    readonly securitySchemes: Record<string, JsonObject>;
    readonly parameters: Record<string, JsonObject>;
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const openApiPath = resolve(here, "..", "..", "openapi.yaml");

async function loadDocument(): Promise<ParsedOpenApi> {
  const source = await readFile(openApiPath, "utf8");
  return parse(source) as ParsedOpenApi;
}

function collectRefs(value: unknown, refs: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectRefs(item, refs);
    }
    return refs;
  }
  if (typeof value !== "object" || value === null) {
    return refs;
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "$ref" && typeof child === "string") {
      refs.push(child);
    } else {
      collectRefs(child, refs);
    }
  }
  return refs;
}

function resolvePointer(document: unknown, ref: string): unknown {
  if (ref === "#") {
    return document;
  }
  if (!ref.startsWith("#/")) {
    return undefined;
  }

  let current: unknown = document;
  for (const rawSegment of ref.slice(2).split("/")) {
    const segment = decodeURIComponent(rawSegment).replace(/~1/g, "/").replace(/~0/g, "~");
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as JsonObject)[segment];
  }
  return current;
}

function responseKeys(
  document: ParsedOpenApi,
  path: string,
  method: string
): string[] {
  const operation = document.paths[path]?.[method] as
    | { responses?: JsonObject }
    | undefined;
  return Object.keys(operation?.responses ?? {}).sort();
}

describe("Contrato OpenAPI del alcance implementado", () => {
  it("declara solo las rutas y métodos implementados", async () => {
    const document = await loadDocument();

    expect(document.openapi).toBe("3.1.0");
    expect(Object.keys(document.paths).sort()).toEqual([
      "/api/v1/admin/buyers",
      "/api/v1/admin/buyers/{buyerId}",
      "/api/v1/admin/dashboard",
      "/api/v1/admin/inventory",
      "/api/v1/admin/inventory/movements",
      "/api/v1/admin/logistics-operators",
      "/api/v1/admin/orders",
      "/api/v1/admin/orders/{orderId}",
      "/api/v1/admin/payments",
      "/api/v1/admin/products",
      "/api/v1/admin/products/{productId}",
      "/api/v1/admin/reports",
      "/api/v1/admin/sellers",
      "/api/v1/admin/sellers/{sellerId}",
      "/api/v1/admin/users",
      "/api/v1/admin/users/{userId}",
      "/api/v1/admin/warehouses",
      "/api/v1/admin/warehouses/{warehouseId}",
      "/api/v1/auth/login",
      "/api/v1/auth/logout",
      "/api/v1/auth/session",
      "/api/v1/buyers",
      "/api/v1/buyers/me/addresses",
      "/api/v1/buyers/me/addresses/{direccionId}",
      "/api/v1/buyers/me/addresses/{direccionId}/principal",
      "/api/v1/cart",
      "/api/v1/cart/items",
      "/api/v1/cart/items/{productoId}",
      "/api/v1/categories",
      "/api/v1/checkout",
      "/api/v1/logistics/inventory",
      "/api/v1/logistics/orders",
      "/api/v1/logistics/orders/{orderId}",
      "/api/v1/logistics/orders/{orderId}/prepare",
      "/api/v1/logistics/profile",
      "/api/v1/logistics/shipments/{shipmentId}/delivery",
      "/api/v1/logistics/shipments/{shipmentId}/dispatch",
      "/api/v1/logistics/summary",
      "/api/v1/logistics/warehouses",
      "/api/v1/orders",
      "/api/v1/orders/{orderId}",
      "/api/v1/products",
      "/api/v1/products/{productId}",
      "/api/v1/seller/inventory",
      "/api/v1/seller/inventory/ingresos",
      "/api/v1/seller/orders",
      "/api/v1/seller/orders/{orderId}",
      "/api/v1/seller/products",
      "/api/v1/seller/products/{productId}",
      "/api/v1/seller/products/{productId}/discontinue",
      "/api/v1/seller/products/{productId}/images",
      "/api/v1/seller/products/{productId}/images/{imageId}",
      "/api/v1/seller/products/{productId}/publish",
      "/api/v1/seller/products/{productId}/suspend",
      "/api/v1/seller/profile",
      "/api/v1/seller/warehouses",
      "/api/v1/seller/warehouses/{warehouseId}",
      "/api/v1/supervisor/dashboard",
      "/api/v1/supervisor/inventory",
      "/api/v1/supervisor/orders",
      "/api/v1/supervisor/orders/{orderId}",
      "/api/v1/supervisor/products",
      "/api/v1/supervisor/products/{productId}",
      "/api/v1/supervisor/sellers",
      "/api/v1/supervisor/shipments",
      "/api/v1/supervisor/warehouses",
      "/health",
      "/ready"
    ]);

    expect(Object.keys(document.paths["/api/v1/buyers"] ?? {})).toEqual(["post"]);
    expect(Object.keys(document.paths["/api/v1/products"] ?? {})).toEqual(["get"]);
    expect(Object.keys(document.paths["/api/v1/products/{productId}"] ?? {})).toEqual([
      "get"
    ]);
    expect(Object.keys(document.paths["/api/v1/categories"] ?? {})).toEqual(["get"]);
    expect(Object.keys(document.paths["/api/v1/auth/login"] ?? {})).toEqual(["post"]);
    expect(Object.keys(document.paths["/api/v1/auth/logout"] ?? {})).toEqual(["post"]);
    expect(Object.keys(document.paths["/api/v1/auth/session"] ?? {})).toEqual(["get"]);
    expect(Object.keys(document.paths["/api/v1/admin/sellers"] ?? {}).sort()).toEqual([
      "get",
      "post"
    ]);
    expect(Object.keys(document.paths["/api/v1/buyers/me/addresses"] ?? {}).sort()).toEqual([
      "get",
      "post"
    ]);
    expect(
      Object.keys(document.paths["/api/v1/buyers/me/addresses/{direccionId}"] ?? {}).sort()
    ).toEqual(["delete", "parameters", "patch"]);
    expect(
      Object.keys(
        document.paths["/api/v1/buyers/me/addresses/{direccionId}/principal"] ?? {}
      )
    ).toEqual(["post"]);
    expect(Object.keys(document.paths["/api/v1/cart"] ?? {})).toEqual(["get"]);
    expect(Object.keys(document.paths["/api/v1/cart/items"] ?? {})).toEqual(["post"]);
    expect(
      Object.keys(document.paths["/api/v1/cart/items/{productoId}"] ?? {}).sort()
    ).toEqual(["delete", "parameters", "patch"]);
    expect(Object.keys(document.paths["/api/v1/checkout"] ?? {})).toEqual(["post"]);
    expect(Object.keys(document.paths["/api/v1/orders"] ?? {})).toEqual(["get"]);
    expect(Object.keys(document.paths["/api/v1/orders/{orderId}"] ?? {})).toEqual([
      "get"
    ]);
    expect(Object.keys(document.paths["/api/v1/seller/profile"] ?? {}).sort()).toEqual([
      "get",
      "patch"
    ]);
    expect(Object.keys(document.paths["/api/v1/seller/products"] ?? {}).sort()).toEqual([
      "get",
      "post"
    ]);
    expect(
      Object.keys(document.paths["/api/v1/seller/products/{productId}"] ?? {}).sort()
    ).toEqual(["get", "parameters", "patch"]);
    expect(
      Object.keys(
        document.paths["/api/v1/seller/products/{productId}/images"] ?? {}
      ).sort()
    ).toEqual(["parameters", "post"]);
    expect(
      Object.keys(
        document.paths["/api/v1/seller/products/{productId}/images/{imageId}"] ?? {}
      ).sort()
    ).toEqual(["delete", "parameters"]);
    expect(
      Object.keys(
        document.paths["/api/v1/seller/products/{productId}/publish"] ?? {}
      ).sort()
    ).toEqual(["parameters", "post"]);
    expect(
      Object.keys(
        document.paths["/api/v1/seller/products/{productId}/suspend"] ?? {}
      ).sort()
    ).toEqual(["parameters", "post"]);
    expect(
      Object.keys(
        document.paths["/api/v1/seller/products/{productId}/discontinue"] ?? {}
      ).sort()
    ).toEqual(["parameters", "post"]);
    expect(Object.keys(document.paths["/api/v1/seller/warehouses"] ?? {}).sort()).toEqual([
      "get",
      "post"
    ]);
    expect(
      Object.keys(document.paths["/api/v1/seller/warehouses/{warehouseId}"] ?? {}).sort()
    ).toEqual(["parameters", "patch"]);
    expect(Object.keys(document.paths["/api/v1/seller/inventory"] ?? {})).toEqual(["get"]);
    expect(
      Object.keys(document.paths["/api/v1/seller/inventory/ingresos"] ?? {})
    ).toEqual(["post"]);
    expect(Object.keys(document.paths["/api/v1/seller/orders"] ?? {})).toEqual(["get"]);
    expect(Object.keys(document.paths["/api/v1/seller/orders/{orderId}"] ?? {})).toEqual([
      "get"
    ]);
    expect(Object.keys(document.paths["/api/v1/logistics/profile"] ?? {})).toEqual([
      "get"
    ]);
    expect(Object.keys(document.paths["/api/v1/logistics/warehouses"] ?? {})).toEqual([
      "get"
    ]);
    expect(Object.keys(document.paths["/api/v1/logistics/inventory"] ?? {})).toEqual([
      "get"
    ]);
    expect(Object.keys(document.paths["/api/v1/logistics/summary"] ?? {})).toEqual([
      "get"
    ]);
    expect(Object.keys(document.paths["/api/v1/logistics/orders"] ?? {})).toEqual([
      "get"
    ]);
    expect(
      Object.keys(document.paths["/api/v1/logistics/orders/{orderId}"] ?? {})
    ).toEqual(["get"]);
    expect(
      Object.keys(document.paths["/api/v1/logistics/orders/{orderId}/prepare"] ?? {})
    ).toEqual(["post"]);
    expect(
      Object.keys(
        document.paths["/api/v1/logistics/shipments/{shipmentId}/dispatch"] ?? {}
      )
    ).toEqual(["post"]);
    expect(
      Object.keys(
        document.paths["/api/v1/logistics/shipments/{shipmentId}/delivery"] ?? {}
      )
    ).toEqual(["post"]);
    expect(
      Object.keys(document.paths["/api/v1/admin/logistics-operators"] ?? {})
    ).toEqual(["post"]);
    for (const path of [
      "/api/v1/supervisor/dashboard",
      "/api/v1/supervisor/orders",
      "/api/v1/supervisor/orders/{orderId}",
      "/api/v1/supervisor/products",
      "/api/v1/supervisor/products/{productId}",
      "/api/v1/supervisor/warehouses",
      "/api/v1/supervisor/inventory",
      "/api/v1/supervisor/shipments",
      "/api/v1/supervisor/sellers"
    ]) {
      expect(Object.keys(document.paths[path] ?? {}), `${path} debe ser solo GET`).toEqual([
        "get"
      ]);
    }
    for (const path of [
      "/api/v1/admin/dashboard",
      "/api/v1/admin/reports",
      "/api/v1/admin/users",
      "/api/v1/admin/users/{userId}",
      "/api/v1/admin/buyers",
      "/api/v1/admin/buyers/{buyerId}",
      "/api/v1/admin/sellers/{sellerId}",
      "/api/v1/admin/warehouses",
      "/api/v1/admin/warehouses/{warehouseId}",
      "/api/v1/admin/products",
      "/api/v1/admin/products/{productId}",
      "/api/v1/admin/inventory",
      "/api/v1/admin/inventory/movements",
      "/api/v1/admin/orders",
      "/api/v1/admin/orders/{orderId}",
      "/api/v1/admin/payments"
    ]) {
      expect(Object.keys(document.paths[path] ?? {}), `${path} debe ser solo GET`).toEqual([
        "get"
      ]);
    }
    expect(Object.keys(document.paths["/health"] ?? {})).toEqual(["get"]);
    expect(Object.keys(document.paths["/ready"] ?? {})).toEqual(["get"]);
  });

  it("declara las respuestas que el adaptador HTTP puede producir", async () => {
    const document = await loadDocument();

    expect(responseKeys(document, "/api/v1/buyers", "post")).toEqual([
      "201",
      "400",
      "409",
      "413",
      "415",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/products", "get")).toEqual([
      "200",
      "400",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/products/{productId}", "get")).toEqual([
      "200",
      "400",
      "404",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/health", "get")).toEqual(["200"]);
    expect(responseKeys(document, "/ready", "get")).toEqual(["200", "503"]);

    expect(responseKeys(document, "/api/v1/auth/login", "post")).toEqual([
      "200",
      "400",
      "401",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/auth/logout", "post")).toEqual([
      "204",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/auth/session", "get")).toEqual([
      "200",
      "401",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/buyers/me/addresses", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/buyers/me/addresses", "post")).toEqual([
      "201",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(
      responseKeys(document, "/api/v1/buyers/me/addresses/{direccionId}", "patch")
    ).toEqual(["200", "400", "401", "403", "404", "500", "503"]);
    expect(
      responseKeys(document, "/api/v1/buyers/me/addresses/{direccionId}", "delete")
    ).toEqual(["204", "401", "403", "404", "500", "503"]);
    expect(
      responseKeys(
        document,
        "/api/v1/buyers/me/addresses/{direccionId}/principal",
        "post"
      )
    ).toEqual(["204", "401", "403", "404", "500", "503"]);
    expect(responseKeys(document, "/api/v1/admin/sellers", "post")).toEqual([
      "201",
      "400",
      "401",
      "403",
      "409",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/cart", "get")).toEqual([
      "200",
      "401",
      "403",
      "404",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/cart/items", "post")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "404",
      "422",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/cart/items/{productoId}", "patch")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "404",
      "422",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/cart/items/{productoId}", "delete")).toEqual([
      "200",
      "401",
      "403",
      "404",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/checkout", "post")).toEqual([
      "201",
      "202",
      "400",
      "401",
      "403",
      "404",
      "422",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/orders", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/orders/{orderId}", "get")).toEqual([
      "200",
      "401",
      "403",
      "404",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/seller/profile", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/seller/profile", "patch")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/seller/products", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/seller/products", "post")).toEqual([
      "201",
      "400",
      "401",
      "403",
      "409",
      "500",
      "503"
    ]);
    expect(
      responseKeys(document, "/api/v1/seller/products/{productId}", "get")
    ).toEqual(["200", "401", "403", "404", "500", "503"]);
    expect(
      responseKeys(document, "/api/v1/seller/products/{productId}", "patch")
    ).toEqual([
      "200",
      "400",
      "401",
      "403",
      "404",
      "409",
      "422",
      "500",
      "503"
    ]);
    expect(
      responseKeys(document, "/api/v1/seller/products/{productId}/images", "post")
    ).toEqual(["201", "400", "401", "403", "404", "422", "500", "503"]);
    expect(
      responseKeys(
        document,
        "/api/v1/seller/products/{productId}/images/{imageId}",
        "delete"
      )
    ).toEqual(["200", "401", "403", "404", "422", "500", "503"]);
    for (const action of ["publish", "suspend", "discontinue"]) {
      expect(
        responseKeys(
          document,
          `/api/v1/seller/products/{productId}/${action}`,
          "post"
        )
      ).toEqual(["200", "401", "403", "404", "422", "500", "503"]);
    }
    expect(responseKeys(document, "/api/v1/seller/warehouses", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/seller/warehouses", "post")).toEqual([
      "201",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(
      responseKeys(document, "/api/v1/seller/warehouses/{warehouseId}", "patch")
    ).toEqual(["200", "400", "401", "403", "404", "500", "503"]);
    expect(responseKeys(document, "/api/v1/seller/inventory", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(
      responseKeys(document, "/api/v1/seller/inventory/ingresos", "post")
    ).toEqual(["200", "201", "400", "401", "403", "404", "422", "500", "503"]);
    expect(responseKeys(document, "/api/v1/seller/orders", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/seller/orders/{orderId}", "get")).toEqual([
      "200",
      "401",
      "403",
      "404",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/logistics/profile", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/logistics/warehouses", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/logistics/inventory", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/logistics/summary", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/logistics/orders", "get")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(
      responseKeys(document, "/api/v1/logistics/orders/{orderId}", "get")
    ).toEqual(["200", "401", "403", "404", "500", "503"]);
    expect(
      responseKeys(document, "/api/v1/logistics/orders/{orderId}/prepare", "post")
    ).toEqual(["200", "201", "400", "401", "403", "404", "422", "500", "503"]);
    expect(
      responseKeys(
        document,
        "/api/v1/logistics/shipments/{shipmentId}/dispatch",
        "post"
      )
    ).toEqual(["200", "201", "400", "401", "403", "404", "422", "500", "503"]);
    expect(
      responseKeys(
        document,
        "/api/v1/logistics/shipments/{shipmentId}/delivery",
        "post"
      )
    ).toEqual(["200", "201", "400", "401", "403", "404", "422", "500", "503"]);
    expect(responseKeys(document, "/api/v1/admin/logistics-operators", "post")).toEqual([
      "201",
      "400",
      "401",
      "403",
      "409",
      "422",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/supervisor/dashboard", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/supervisor/orders", "get")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/supervisor/orders/{orderId}", "get")).toEqual([
      "200",
      "401",
      "403",
      "404",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/supervisor/products", "get")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(
      responseKeys(document, "/api/v1/supervisor/products/{productId}", "get")
    ).toEqual(["200", "401", "403", "404", "500", "503"]);
    expect(responseKeys(document, "/api/v1/supervisor/warehouses", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/supervisor/inventory", "get")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/supervisor/shipments", "get")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/supervisor/sellers", "get")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/admin/dashboard", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/admin/reports", "get")).toEqual([
      "200",
      "401",
      "403",
      "500",
      "503"
    ]);
    expect(responseKeys(document, "/api/v1/admin/sellers", "get")).toEqual([
      "200",
      "400",
      "401",
      "403",
      "500",
      "503"
    ]);
    for (const [path, expected] of [
      ["/api/v1/admin/users", ["200", "400", "401", "403", "500", "503"]],
      ["/api/v1/admin/users/{userId}", ["200", "400", "401", "403", "404", "500", "503"]],
      ["/api/v1/admin/buyers", ["200", "400", "401", "403", "500", "503"]],
      ["/api/v1/admin/buyers/{buyerId}", ["200", "400", "401", "403", "404", "500", "503"]],
      ["/api/v1/admin/sellers/{sellerId}", ["200", "400", "401", "403", "404", "500", "503"]],
      ["/api/v1/admin/warehouses", ["200", "400", "401", "403", "500", "503"]],
      [
        "/api/v1/admin/warehouses/{warehouseId}",
        ["200", "400", "401", "403", "404", "500", "503"]
      ],
      ["/api/v1/admin/products", ["200", "400", "401", "403", "500", "503"]],
      ["/api/v1/admin/products/{productId}", ["200", "400", "401", "403", "404", "500", "503"]],
      ["/api/v1/admin/inventory", ["200", "400", "401", "403", "500", "503"]],
      ["/api/v1/admin/inventory/movements", ["200", "400", "401", "403", "500", "503"]],
      ["/api/v1/admin/orders", ["200", "400", "401", "403", "500", "503"]],
      ["/api/v1/admin/orders/{orderId}", ["200", "400", "401", "403", "404", "500", "503"]],
      ["/api/v1/admin/payments", ["200", "400", "401", "403", "500", "503"]]
    ] as const) {
      expect(responseKeys(document, path, "get"), path).toEqual(expected);
    }
  });

  it("rechaza propiedades desconocidas donde el adaptador las rechaza", async () => {
    const document = await loadDocument();

    for (const schemaName of [
      "RegisterBuyerRequest",
      "DocumentoIdentidad",
      "LoginRequest",
      "CreateAddressRequest",
      "UpdateAddressRequest",
      "RegisterSellerRequest",
      "WarehouseInput",
      "AddCartItemRequest",
      "UpdateCartItemRequest",
      "CheckoutRequest",
      "UpdateSellerProfileRequest",
      "CreateSellerProductRequest",
      "UpdateSellerProductRequest",
      "AddSellerImageRequest",
      "CreateSellerWarehouseRequest",
      "UpdateSellerWarehouseRequest",
      "SellerIngressRequest",
      "PrepareShipmentRequest",
      "DispatchShipmentRequest",
      "DeliveryRequest",
      "RegisterLogisticsOperatorRequest"
    ]) {
      expect(
        document.components.schemas[schemaName]?.additionalProperties,
        `${schemaName} debe rechazar propiedades desconocidas`
      ).toBe(false);
    }
  });

  it("declara autenticación por cookie y bearer", async () => {
    const document = await loadDocument();

    expect(document.components.securitySchemes.SessionCookie).toMatchObject({
      type: "apiKey",
      in: "cookie",
      name: "nexus_session"
    });
    expect(document.components.securitySchemes.BearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer"
    });

    const sessionOperation = document.paths["/api/v1/auth/session"]?.get as
      | { security?: unknown }
      | undefined;
    expect(sessionOperation?.security).toEqual([
      { SessionCookie: [] },
      { BearerAuth: [] }
    ]);
  });

  it("declara errores globales y la validación de correlación", async () => {
    const document = await loadDocument();

    expect(Object.keys(document["x-global-errors"] ?? {}).sort()).toEqual([
      "404",
      "405"
    ]);
    expect(document.components.responses.NotFound).toBeDefined();
    expect(document.components.responses.MethodNotAllowed).toBeDefined();

    const correlationSchema = document.components.headers.CorrelationId?.schema;
    expect(correlationSchema).toMatchObject({
      type: "string",
      minLength: 1,
      maxLength: 200,
      pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"
    });

    const errorSchema = document.components.schemas.ErrorResponse;
    const errorProperty = (errorSchema?.properties as JsonObject | undefined)?.error;
    const codigo = (
      (errorProperty as JsonObject | undefined)?.properties as JsonObject | undefined
    )?.codigo;
    expect((codigo as JsonObject | undefined)?.enum).toEqual(
      expect.arrayContaining([
        "NO_AUTENTICADO",
        "NO_AUTORIZADO",
        "RUTA_NO_ENCONTRADA",
        "METODO_NO_PERMITIDO",
        "ERROR_INTERNO"
      ])
    );
  });

  it("no deja referencias locales sin resolver", async () => {
    const document = await loadDocument();
    const refs = collectRefs(document);

    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(resolvePointer(document, ref), `Referencia sin resolver: ${ref}`).toBeDefined();
    }
  });
});
