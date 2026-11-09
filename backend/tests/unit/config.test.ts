import { describe, expect, it } from "vitest";
import { loadConfig, parseCorsOrigins } from "../../src/config.js";

const DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket";

describe("Configuración", () => {
  it("desactiva CORS por defecto", () => {
    const config = loadConfig({ DATABASE_URL });
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

  it("exige DATABASE_URL: PostgreSQL es la única persistencia", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ DATABASE_URL: "" })).toThrow(/DATABASE_URL/);
  });

  it("rechaza el antiguo modo en memoria", () => {
    expect(() =>
      loadConfig({ DATABASE_URL, PERSISTENCE: "memory" } as NodeJS.ProcessEnv)
    ).not.toThrow();
    const config = loadConfig({ DATABASE_URL, PERSISTENCE: "memory" } as NodeJS.ProcessEnv);
    expect(config).not.toHaveProperty("PERSISTENCE");
  });
});
