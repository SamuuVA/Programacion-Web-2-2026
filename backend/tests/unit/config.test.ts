import { describe, expect, it } from "vitest";
import { loadConfig, parseCorsOrigins } from "../../src/config.js";

describe("Configuración", () => {
  it("desactiva CORS por defecto", () => {
    const config = loadConfig({});
    expect(config.CORS_ORIGINS).toEqual([]);
  });

  it("normaliza y deduplica orígenes exactos", () => {
    expect(
      parseCorsOrigins(
        "http://localhost:5173, https://example.com, http://LOCALHOST:5173"
      )
    ).toEqual(["http://localhost:5173", "https://example.com"]);
  });

  it("rechaza orígenes con ruta, comodines o protocolos no HTTP", () => {
    expect(() => parseCorsOrigins("http://localhost:5173/app")).toThrow(
      /sin ruta/
    );
    expect(() => parseCorsOrigins("*")).toThrow(/inválido/);
    expect(() => parseCorsOrigins("file:///tmp")).toThrow(/http\/https/);
  });

  it("exige DATABASE_URL cuando la persistencia es PostgreSQL", () => {
    expect(() =>
      loadConfig({ PERSISTENCE: "postgres", DATABASE_URL: "" })
    ).toThrow(/DATABASE_URL/);
  });
});
