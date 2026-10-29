import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type JsonObject = Record<string, unknown>;

interface ParsedOpenApi {
  readonly openapi: string;
  readonly paths: Record<string, Record<string, JsonObject>>;
  readonly "x-global-errors"?: Record<string, unknown>;
  readonly components: {
    readonly schemas: Record<string, JsonObject>;
    readonly headers: Record<string, JsonObject>;
    readonly responses: Record<string, JsonObject>;
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

describe("Contrato OpenAPI del alcance implementado", () => {
  it("declara solo las rutas y métodos implementados", async () => {
    const document = await loadDocument();

    expect(document.openapi).toBe("3.1.0");
    expect(Object.keys(document.paths).sort()).toEqual([
      "/api/v1/buyers",
      "/health",
      "/ready"
    ]);
    expect(Object.keys(document.paths["/api/v1/buyers"] ?? {})).toEqual(["post"]);
    expect(Object.keys(document.paths["/health"] ?? {})).toEqual(["get"]);
    expect(Object.keys(document.paths["/ready"] ?? {})).toEqual(["get"]);
  });

  it("declara las respuestas que el adaptador HTTP puede producir", async () => {
    const document = await loadDocument();

    const buyerResponses = document.paths["/api/v1/buyers"]?.post?.responses;
    const healthResponses = document.paths["/health"]?.get?.responses;
    const readyResponses = document.paths["/ready"]?.get?.responses;

    expect(Object.keys(buyerResponses as JsonObject).sort()).toEqual([
      "201",
      "400",
      "409",
      "413",
      "415",
      "500",
      "503"
    ]);
    expect(Object.keys(healthResponses as JsonObject)).toEqual(["200"]);
    expect(Object.keys(readyResponses as JsonObject).sort()).toEqual(["200", "503"]);
  });

  it("rechaza propiedades desconocidas donde el adaptador las rechaza", async () => {
    const document = await loadDocument();

    expect(
      document.components.schemas.RegisterBuyerRequest?.additionalProperties
    ).toBe(false);
    expect(
      document.components.schemas.DocumentoIdentidad?.additionalProperties
    ).toBe(false);
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
